import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getUncachableStripeClient, getStripePublishableKey } from "../../lib/stripeClient";
import { stripeStorage } from "../../lib/stripeStorage";
import {
  sendWelcomeEmail,
  sendUpgradeEmail,
  sendCancellationEmail,
  sendPaymentFailedEmail,
  sendReceiptEmail,
} from "../../lib/emailService";

const router = Router();

const PLAN_METADATA: Record<string, { name: string; price: string }> = {
  starter: { name: "Starter", price: "$79" },
  growth: { name: "Growth", price: "$199" },
  business: { name: "Business", price: "$499" },
  enterprise: { name: "Enterprise", price: "Custom" },
};

function getPlanLabel(metadata: any): string {
  const tier = metadata?.tier || metadata?.plan || "";
  return PLAN_METADATA[tier.toLowerCase()]?.name || tier || "Unknown";
}

function getPlanPrice(metadata: any): string {
  const tier = metadata?.tier || metadata?.plan || "";
  return PLAN_METADATA[tier.toLowerCase()]?.price || "";
}

function getAppUrl(req: any): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domains ? `https://${domains}/twilio-platform` : `${req.protocol}://${req.get("host")}/twilio-platform`;
}

// GET /api/stripe/publishable-key — public
router.get("/publishable-key", async (_req, res) => {
  try {
    const key = await getStripePublishableKey();
    res.json({ publishableKey: key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stripe/products — public, list plans
router.get("/products", async (_req, res) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();
    const map = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!map.has(row.product_id)) {
        map.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        map.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ data: Array.from(map.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stripe/subscription — current user's subscription
router.get("/subscription", requireAuth(), async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const customer = await stripeStorage.getCustomerByUserId(userId);
    if (!customer) return res.json({ subscription: null, plan: "free" });

    const sub = await stripeStorage.getActiveSubscriptionForCustomer(customer.id);
    if (!sub) return res.json({ subscription: null, plan: "free" });

    res.json({ subscription: sub, plan: (sub as any).metadata?.tier || "starter" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/checkout — create checkout session
router.post("/checkout", requireAuth(), async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { priceId } = req.body;
    if (!priceId) return res.status(400).json({ error: "priceId required" });

    const stripe = await getUncachableStripeClient();

    // Find or create customer
    let customer = await stripeStorage.getCustomerByUserId(userId);
    let customerId: string;

    if (customer) {
      customerId = (customer as any).id;
    } else {
      // We don't have the user's email here directly — embed userId in metadata
      // Clerk user data will be used on frontend for display
      const newCustomer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = newCustomer.id;
    }

    const appUrl = getAppUrl(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?cancelled=1`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/portal — customer portal for managing billing
router.post("/portal", requireAuth(), async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const customer = await stripeStorage.getCustomerByUserId(userId);
    if (!customer) return res.status(404).json({ error: "No billing account found" });

    const stripe = await getUncachableStripeClient();
    const appUrl = getAppUrl(req);

    const session = await stripe.billingPortal.sessions.create({
      customer: (customer as any).id,
      return_url: `${appUrl}/billing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/webhook-notify — called internally after webhook events to send emails
router.post("/webhook-notify", async (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.INTERNAL_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { type, data } = req.body;

  try {
    const stripe = await getUncachableStripeClient();

    if (type === "customer.subscription.created") {
      const sub = data;
      const customer = await stripe.customers.retrieve(sub.customer);
      if (customer.deleted) return res.json({ ok: true });
      const email = (customer as any).email;
      const name = (customer as any).name || "";
      if (!email) return res.json({ ok: true });

      const planName = getPlanLabel(sub.metadata);
      const planPrice = getPlanPrice(sub.metadata);
      const appUrl = getAppUrl(req);

      await sendWelcomeEmail({ to: email, name, planName, planPrice, dashboardUrl: appUrl });
    }

    if (type === "customer.subscription.updated") {
      const sub = data;
      const customer = await stripe.customers.retrieve(sub.customer);
      if (customer.deleted) return res.json({ ok: true });
      const email = (customer as any).email;
      const name = (customer as any).name || "";
      if (!email) return res.json({ ok: true });

      const newPlan = getPlanLabel(sub.metadata);
      const newPrice = getPlanPrice(sub.metadata);
      const appUrl = getAppUrl(req);

      await sendUpgradeEmail({
        to: email,
        name,
        oldPlan: "Previous Plan",
        newPlanName: newPlan,
        newPlanPrice: newPrice,
        dashboardUrl: appUrl,
      });
    }

    if (type === "customer.subscription.deleted") {
      const sub = data;
      const customer = await stripe.customers.retrieve(sub.customer);
      if (customer.deleted) return res.json({ ok: true });
      const email = (customer as any).email;
      const name = (customer as any).name || "";
      if (!email) return res.json({ ok: true });

      const planName = getPlanLabel(sub.metadata);
      const endDate = new Date((sub.current_period_end || 0) * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const appUrl = getAppUrl(req);

      await sendCancellationEmail({ to: email, name, planName, endDate, dashboardUrl: appUrl });
    }

    if (type === "invoice.payment_failed") {
      const inv = data;
      const customer = await stripe.customers.retrieve(inv.customer);
      if (customer.deleted) return res.json({ ok: true });
      const email = (customer as any).email;
      const name = (customer as any).name || "";
      if (!email) return res.json({ ok: true });

      const amount = `$${((inv.amount_due || 0) / 100).toFixed(2)}`;
      const appUrl = getAppUrl(req);

      await sendPaymentFailedEmail({ to: email, name, planName: "Subscription", amount, dashboardUrl: appUrl });
    }

    if (type === "invoice.payment_succeeded") {
      const inv = data;
      const customer = await stripe.customers.retrieve(inv.customer);
      if (customer.deleted) return res.json({ ok: true });
      const email = (customer as any).email;
      const name = (customer as any).name || "";
      if (!email) return res.json({ ok: true });

      const amount = `$${((inv.amount_paid || 0) / 100).toFixed(2)}`;
      const date = new Date((inv.created || 0) * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await sendReceiptEmail({
        to: email,
        name,
        planName: "Subscription",
        amount,
        invoiceUrl: inv.hosted_invoice_url,
        date,
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[webhook-notify]", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
