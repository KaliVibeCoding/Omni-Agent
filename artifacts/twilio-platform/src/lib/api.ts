/**
 * Authenticated API helper for hand-rolled fetches.
 *
 * The generated hooks in `@workspace/api-client-react` already attach
 * `Authorization: Bearer <Clerk JWT>` once setAuthTokenGetter() is called
 * at app start (see App.tsx → ApiAuthBridge). For ad-hoc fetches against
 * /api/tenant/*, /api/me, /api/admin/*, /api/stripe/* etc. we use the
 * helpers below.
 *
 * Two equivalent surfaces are exported so the rest of the app can pick
 * whichever style is cleaner at the call site:
 *
 *   1. apiFetch<T>(path, { getToken, body, method, ... })   — one-shot
 *   2. const api = useApi();  api<T>(path, opts)            — hook style
 *
 * Errors thrown from these helpers are `ApiHttpError` instances so
 * callers can read `.status` and `.body`.
 */

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
export const API_BASE = BASE;

export class ApiHttpError<T = any> extends Error {
  status: number;
  statusText: string;
  body: T | null;
  constructor(status: number, statusText: string, body: T | null, message?: string) {
    super(message ?? `HTTP ${status} ${statusText}`);
    this.name = "ApiHttpError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Clerk getToken(); optional for public routes. */
  getToken?: () => Promise<string | null>;
  /** JSON body — auto-stringified + content-type set. Pass a string/FormData/Blob raw. */
  body?: any;
  /** Skip JSON parsing — receive the raw Response back. */
  raw?: boolean;
}

function buildUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function attachAuth(headers: Headers, getToken?: () => Promise<string | null>) {
  if (!getToken || headers.has("Authorization")) return;
  try {
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    /* swallow — endpoint may be public */
  }
}

function prepareBody(body: any, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string" || body instanceof FormData || body instanceof Blob) {
    return body as BodyInit;
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new ApiHttpError(res.status, res.statusText, data, msg);
  }
  return data as T;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { getToken, body, raw, headers: hdrInit, ...rest } = options;
  const headers = new Headers(hdrInit);
  await attachAuth(headers, getToken);
  const finalBody = prepareBody(body, headers);

  const res = await fetch(buildUrl(path), {
    credentials: "include",
    ...rest,
    headers,
    body: finalBody,
  });

  if (raw) return res as unknown as T;
  return parseResponse<T>(res);
}
