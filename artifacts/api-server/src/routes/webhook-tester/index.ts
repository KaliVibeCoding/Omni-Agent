import { Router } from "express";

const router = Router();

router.post("/send", async (req, res, next) => {
  try {
    const { url, method = "POST", params = {}, headers = {} } = req.body as {
      url: string;
      method?: string;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    };

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "url is required" });
      return;
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
      res.json({
        ok: false,
        status: 0,
        statusText: "Network Error",
        responseTime: Date.now() - start,
        body: fetchErr?.message ?? String(fetchErr),
        contentType: "text/plain",
        error: true,
      });
      return;
    }

    const responseTime = Date.now() - start;
    const contentType = response.headers.get("content-type") ?? "text/plain";
    const rawBody = await response.text();

    res.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      body: rawBody,
      contentType,
      error: false,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
