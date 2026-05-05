/**
 * Seed script: creates the 4 RJ Business Solutions subscription plans in Stripe.
 * Run with: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 * Safe to run multiple times — idempotent.
 */

import Stripe from "stripe";

async function getStripeClient(): Promise<Stripe> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : null;

  if (!hostname || !xReplitToken) {
    // Fallback: direct key from env
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("No Stripe credentials available. Set STRIPE_SECRET_KEY or run inside Replit.");
    return new Stripe(key, { apiVersion: "2025-08-27.basil" as any });
  }

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", "development");

  const resp = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
  });
  const data = await resp.json();
  const secretKey = data.items?.[0]?.settings?.secret;
  if (!secretKey) throw new Error("Stripe secret key not found in connector credentials.");

  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

const PLANS = [
  {
    name: "Starter",
    description: "Perfect for small businesses and solo operators. Full Twilio communications platform with SMS, calls, and phone number management.",
    price: 7900,
    tier: "starter",
    features: ["Up to 1,000 SMS/month", "Basic call center", "Email campaigns", "Phone number management", "Number lookup", "Voicemails"],
  },
  {
    name: "Growth",
    description: "For growing teams that need advanced automation, AI voice agents, and multi-channel campaigns.",
    price: 19900,
    tier: "growth",
    features: ["Up to 10,000 SMS/month", "Advanced call center", "AI voice agents", "Multi-channel campaigns", "Telehealth module", "Studio Flows", "Priority support"],
  },
  {
    name: "Business",
    description: "Full platform for established businesses including the proprietary multi-agent AGI framework and white-label options.",
    price: 49900,
    tier: "business",
    features: ["Unlimited SMS", "Multi-agent AGI framework", "Full call center suite", "White-label options", "Custom integrations", "HIPAA compliance tools", "Dedicated support"],
  },
  {
    name: "Enterprise",
    description: "Custom pricing for large organizations. Dedicated infrastructure, SLA guarantees, and a dedicated success team.",
    price: 0,
    tier: "enterprise",
    features: ["Everything in Business", "Dedicated infrastructure", "SLA guarantees", "Custom contracts", "24/7 dedicated support", "Custom onboarding"],
  },
];

async function seedProducts() {
  const stripe = await getStripeClient();
  console.log("🚀 Seeding RJ Business Solutions plans into Stripe...\n");

  for (const plan of PLANS) {
    // Check if product already exists
    const existing = await stripe.products.search({
      query: `name:'${plan.name}' AND active:'true'`,
    });

    if (existing.data.length > 0) {
      console.log(`✓ ${plan.name} plan already exists (${existing.data[0].id})`);
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        tier: plan.tier,
        features: plan.features.join("|"),
        platform: "rj-business-solutions",
      },
    });

    console.log(`✓ Created product: ${product.name} (${product.id})`);

    if (plan.price > 0) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { tier: plan.tier },
      });
      console.log(`  └─ Monthly price: $${plan.price / 100}/mo (${price.id})`);
    } else {
      // Enterprise — create a $1 placeholder (contact sales)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 1,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { tier: plan.tier, custom: "true" },
      });
      console.log(`  └─ Custom pricing placeholder (${price.id})`);
    }
  }

  console.log("\n✅ All plans seeded! Webhooks will sync them to the database automatically.");
}

seedProducts().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
