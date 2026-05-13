interface Env {
  CF_WORKER_URL: string;
}

/**
 * Cloudflare Pages → CF Worker reverse proxy.
 *
 * Forwards every /api/* request to the Hono worker, preserving headers
 * (Authorization: Bearer <Clerk JWT> in particular — the worker uses that
 * to extract userId), method, query string, and body.
 *
 * Adds permissive CORS preflight handling so the browser fetch with a
 * non-simple "Authorization" header succeeds on first call.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const workerUrl = context.env.CF_WORKER_URL;
  if (!workerUrl) {
    return new Response(
      JSON.stringify({ error: "CF_WORKER_URL not configured in Pages env vars" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // CORS preflight — answer locally so the browser can attach Authorization.
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": context.request.headers.get("origin") ?? "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      },
    });
  }

  const url = new URL(context.request.url);
  const targetUrl = `${workerUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;
  const isBodyless = ["GET", "HEAD"].includes(context.request.method);

  // Clone headers so we don't mutate the original immutable Headers object.
  const headers = new Headers(context.request.headers);
  // Drop hop-by-hop and host-specific headers that Cloudflare/fetch may reject.
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");

  const upstream = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: isBodyless ? null : context.request.body,
  } as RequestInit);

  // Re-emit response, re-adding CORS so credentials are usable from the SPA.
  const respHeaders = new Headers(upstream.headers);
  respHeaders.set("Access-Control-Allow-Origin", context.request.headers.get("origin") ?? "*");
  respHeaders.set("Vary", "Origin");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
};
