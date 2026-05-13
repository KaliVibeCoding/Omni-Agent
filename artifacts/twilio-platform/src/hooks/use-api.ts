import { useCallback, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { apiFetch, type ApiFetchOptions } from "@/lib/api";
import { isMasterAdminEmail } from "@/lib/admin";

/**
 * Returns a callable `api(path, options)` bound to the current Clerk session.
 *
 *   const api = useApi();
 *   const data = await api<MyType>("/api/tenant/credentials");
 *   await api("/api/tenant/credentials", { method: "POST", body: {...} });
 *
 * The function automatically injects `Authorization: Bearer <Clerk JWT>` so
 * worker routes can resolve userId. `body` may be a plain object (auto JSON)
 * or a string/FormData/Blob (forwarded as-is).
 */
export function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    <T = any>(path: string, options: Omit<ApiFetchOptions, "getToken"> = {}) =>
      apiFetch<T>(path, { ...options, getToken: () => getToken() }),
    [getToken],
  );
}

/**
 * Profile + capability flags for the signed-in user. See cf-worker /api/me.
 *
 * The hook ORs the worker-reported `isMasterAdmin` flag with a client-side
 * email allowlist check so the master admin keeps working even if the
 * worker's Clerk Backend API call fails (missing CLERK_SECRET_KEY, network
 * blip, etc).
 */
export interface MeData {
  signedIn: boolean;
  userId?: string;
  email?: string | null;
  isMasterAdmin: boolean;
  hasTwilioCreds: boolean;
  accountSid?: string | null;
  accountName?: string | null;
  plan?: string;
}

export function useMe() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const api = useApi();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setData({ signedIn: false, isMasterAdmin: false, hasTwilioCreds: false });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api<MeData>("/api/me")
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        // Fall back to a minimal payload — never let /api/me failure brick the app.
        setData({
          signedIn: true,
          email: primaryEmail,
          isMasterAdmin: isMasterAdminEmail(primaryEmail),
          hasTwilioCreds: false,
        });
        setError(e?.message ?? "Failed to load profile");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, api, primaryEmail]);

  const isMasterAdmin = !!data?.isMasterAdmin || isMasterAdminEmail(primaryEmail);

  return {
    loading: !isLoaded || loading,
    data,
    error,
    isMasterAdmin,
    hasTwilioCreds: !!data?.hasTwilioCreds,
    email: primaryEmail,
    isSignedIn: !!isSignedIn,
  };
}

/** Slim hook used by ProtectedRoute. */
export function useMasterAdmin() {
  const { loading, isMasterAdmin } = useMe();
  return { loading, isMasterAdmin };
}
