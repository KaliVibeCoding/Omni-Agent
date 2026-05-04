interface Env {
  CF_WORKER_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const workerUrl = context.env.CF_WORKER_URL;
  if (!workerUrl) {
    return new Response(JSON.stringify({ error: "CF_WORKER_URL not configured in Pages env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(context.request.url);
  const targetUrl = `${workerUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;
  const isBodyless = ["GET", "HEAD"].includes(context.request.method);

  return fetch(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: isBodyless ? null : context.request.body,
  } as RequestInit);
};
