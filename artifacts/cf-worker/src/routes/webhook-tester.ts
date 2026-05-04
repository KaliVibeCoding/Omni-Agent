import { Hono } from "hono";
import type { Env } from "../index";

const webhookTester = new Hono<{ Bindings: Env }>();

webhookTester.post("/send", async (c) => {
  const { url, method = "POST", params = {}, headers = {} } = await c.req.json<{
    url: string;
    method?: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  }>();

  if (!url || typeof url !== "string") {
    return c.json({ error: "url is required" }, 400);
  }

  let targetUrl = url;
  let body: string | undefined;
  const requestHeaders: Record<string, string> = {
    "User-Agent": "TwilioProxy/1.0 RJBusinessSolutions",
    ...headers,
  };

  const upperMethod = method.toUpperCase();

  if (upperMethod === "GET" || upperMethod === "HEAD") {
    const qs = new URLSearchParams(params).toString();
    if (qs) targetUrl = `${url}${url.includes("?") ? "&" : "?"}${qs}`;
  } else {
    body = new URLSearchParams(params).toString();
    requestHeaders["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const start = Date.now();
  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: upperMethod,
      headers: requestHeaders,
      body: upperMethod !== "GET" && upperMethod !== "HEAD" ? body : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch (fetchErr: any) {
    return c.json({
      ok: false,
      status: 0,
      statusText: "Network Error",
      responseTime: Date.now() - start,
      body: fetchErr?.message ?? String(fetchErr),
      contentType: "text/plain",
      error: true,
    });
  }

  const responseTime = Date.now() - start;
  const contentType = response.headers.get("content-type") ?? "text/plain";
  const rawBody = await response.text();

  return c.json({
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    responseTime,
    body: rawBody,
    contentType,
    error: false,
  });
});

export default webhookTester;
