import { Hono } from "hono";
import type { Env } from "../index";
import { requireUserId, AuthError } from "../lib/auth";

const stripe = new Hono<{ Bindings: Env }>();

const STRIPE_API = "https://api.stripe.com/v1";

function stripeHeaders(key: string) {
  return { "Authorization": `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" };
}

async function stripeGet(path: string, key: string) {
  const r = await fetch(`${STRIPE_API}${path}`, { headers: stripeHeaders(key) });
  return r.json() as Promise<any>;
}

async function stripePost(path: string, key: string, body: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) if (v !== undefined) params.set(k, v);
  const r = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: stripeHeaders(key),
    body: params.toString(),
  });
  return r.json() as Promise<any>;
}

const PLAN_META: Record<string, { name: string; price: string }> = {
  starter: { name: "Starter", price: "$79" },
  growth: { name: "Growth", price: "$199" },
  business: { name: "Business", price: "$499" },
  enterprise: { name: "Enterprise", price: "Custom" },
};

// GET /api/stripe/publishable-key
stripe.get("/publishable-key", (c) => {
  const key = c.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) return c.json({ error: "Stripe publishable key not configured" }, 500);
  return c.json({ publishableKey: key });
});

// GET /api/stripe/products — list all plans (public)
stripe.get("/products", async (c) => {
  const key = c.env.STRIPE_SECRET_KEY;
  if (!key) return c.json({ data: [] });
  try {
    const products = await stripeGet("/products?active=true&expand[]=data.default_price&limit=20", key);
    const prices = await stripeGet("/prices?active=true&type=recurring&limit=50", key);
    const priceMap = new Map<string, any[]>();
    for (const p of (prices.data ?? [])) {
      const pid = p.product;
      if (!priceMap.has(pid)) priceMap.set(pid, []);
      priceMap.get(pid)!.push({ id: p.id, unit_amount: p.unit_amount, currency: p.currency, recurring: p.recurring });
    }
    const data = (products.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      metadata: p.metadata,
      prices: priceMap.get(p.id) ?? [],
    }));
    return c.json({ data });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/stripe/subscription — current user subscription
stripe.get("/subscription", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const key = c.env.STRIPE_SECRET_KEY;
    if (!key) return c.json({ subscription: null, plan: "free" });

    const customers = await stripeGet(`/customers/search?query=metadata["userId"]:"${userId}"&limit=1`, key);
    const customer = customers.data?.[0];
    if (!customer) return c.json({ subscription: null, plan: "free" });

    const subs = await stripeGet(`/subscriptions?customer=${customer.id}&status=active&limit=1`, key);
    const sub = subs.data?.[0];
    if (!sub) return c.json({ subscription: null, plan: "free" });

    return c.json({ subscription: sub, plan: sub.metadata?.tier || "starter" });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/stripe/checkout — create checkout session
stripe.post("/checkout", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const key = c.env.STRIPE_SECRET_KEY;
    if (!key) return c.json({ error: "Stripe not configured" }, 500);

    const { priceId } = await c.req.json<{ priceId: string }>();
    if (!priceId) return c.json({ error: "priceId required" }, 400);

    const appUrl = c.env.APP_URL || "https://twilio-platform.pages.dev";

    const customers = await stripeGet(`/customers/search?query=metadata["userId"]:"${userId}"&limit=1`, key);
    let customerId = customers.data?.[0]?.id;

    if (!customerId) {
      const newCustomer = await stripePost("/customers", key, { "metadata[userId]": userId });
      customerId = newCustomer.id;
    }

    const session = await stripePost("/checkout/sessions", key, {
      customer: customerId,
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${appUrl}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?cancelled=1`,
      "metadata[userId]": userId,
      "subscription_data[metadata][userId]": userId,
    });

    return c.json({ url: session.url });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/stripe/portal — customer billing portal
stripe.post("/portal", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const key = c.env.STRIPE_SECRET_KEY;
    if (!key) return c.json({ error: "Stripe not configured" }, 500);

    const customers = await stripeGet(`/customers/search?query=metadata["userId"]:"${userId}"&limit=1`, key);
    const customer = customers.data?.[0];
    if (!customer) return c.json({ error: "No billing account found" }, 404);

    const appUrl = c.env.APP_URL || "https://twilio-platform.pages.dev";

    const session = await stripePost("/billing_portal/sessions", key, {
      customer: customer.id,
      return_url: `${appUrl}/billing`,
    });

    return c.json({ url: session.url });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/stripe/webhook — Stripe webhook handler
stripe.post("/webhook", async (c) => {
  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature");

  if (!sig || !webhookSecret) {
    return c.json({ error: "Missing signature or webhook secret" }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  console.log(`[stripe-webhook] ${event.type}`);
  return c.json({ received: true });
});

export default stripe;
