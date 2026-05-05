import { Hono } from "hono";
import type { Env } from "../index";

const payments = new Hono<{ Bindings: Env }>();

// ── PayPal helpers ────────────────────────────────────────────────────────────

async function getPayPalToken(env: Env): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET)
    throw new Error("PayPal credentials not configured");

  const base = "https://api-m.paypal.com";
  const creds = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);

  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) throw new Error(`PayPal token error: ${await resp.text()}`);
  const data = await resp.json() as { access_token: string };
  return data.access_token;
}

// ── GET /paypal/status — check credentials ────────────────────────────────────

payments.get("/paypal/status", async (c) => {
  try {
    const token = await getPayPalToken(c.env);
    return c.json({ ok: true, tokenPreview: token.slice(0, 16) + "..." });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 503);
  }
});

// ── POST /paypal/order — create PayPal order ──────────────────────────────────

payments.post("/paypal/order", async (c) => {
  const { amount, currency = "USD", description } = await c.req.json<{
    amount: number;
    currency?: string;
    description?: string;
  }>();

  if (!amount) return c.json({ error: "amount is required" }, 400);

  const token = await getPayPalToken(c.env);

  const resp = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description,
      }],
      application_context: {
        return_url: `${c.env.APP_URL}/payment/success`,
        cancel_url: `${c.env.APP_URL}/payment/cancel`,
      },
    }),
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const order = await resp.json() as Record<string, unknown>;

  const approveLink = ((order as any).links ?? []).find((l: any) => l.rel === "approve")?.href;
  return c.json({ orderId: (order as any).id, approveUrl: approveLink, order });
});

// ── POST /paypal/capture/:orderId — capture approved order ────────────────────

payments.post("/paypal/capture/:orderId", async (c) => {
  const orderId = c.req.param("orderId");
  const token = await getPayPalToken(c.env);

  const resp = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

// ── Coinbase helpers ──────────────────────────────────────────────────────────

const COINBASE_BASE = "https://api.coinbase.com/v2";

async function coinbaseHeaders(env: Env) {
  if (!env.COINBASE_API_KEY_ID) throw new Error("Coinbase API key not configured");
  return {
    "CB-ACCESS-KEY": env.COINBASE_API_KEY_ID,
    "CB-VERSION": "2016-02-18",
    "Content-Type": "application/json",
  };
}

// ── GET /coinbase/rates?currency=USD — exchange rates ─────────────────────────

payments.get("/coinbase/rates", async (c) => {
  const currency = c.req.query("currency") ?? "USD";
  const resp = await fetch(`${COINBASE_BASE}/exchange-rates?currency=${currency}`, {
    headers: await coinbaseHeaders(c.env),
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

// ── GET /coinbase/prices/:pair — spot price ───────────────────────────────────

payments.get("/coinbase/prices/:pair", async (c) => {
  const pair = c.req.param("pair"); // e.g. BTC-USD
  const resp = await fetch(`${COINBASE_BASE}/prices/${pair}/spot`, {
    headers: await coinbaseHeaders(c.env),
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

export default payments;
