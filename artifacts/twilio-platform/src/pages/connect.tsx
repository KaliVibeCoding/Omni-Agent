import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useApi, useMasterAdmin } from "@/hooks/use-api";
import { ApiHttpError } from "@/lib/api";

const BASE = import.meta.env.BASE_URL ?? "/";

export default function ConnectPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const api = useApi();
  const { isMasterAdmin } = useMasterAdmin();
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [apiKeySid, setApiKeySid] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Master admin can skip the connect screen entirely
  useEffect(() => {
    if (isMasterAdmin) setLocation("/dashboard");
  }, [isMasterAdmin, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/tenant/credentials", {
        method: "POST",
        body: JSON.stringify({
          accountSid: accountSid.trim(),
          authToken: authToken.trim(),
          apiKeySid: apiKeySid.trim() || undefined,
          apiKeySecret: apiKeySecret.trim() || undefined,
        }),
      });
      setLocation("/dashboard");
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(err.body?.error ?? `Failed (${err.status})`);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connect Your Twilio Account</h1>
          <p className="text-zinc-400 text-sm">
            Welcome, {user?.firstName ?? "there"}! Enter your Twilio credentials to unlock your full communications platform.
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Account SID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={accountSid}
                onChange={e => setAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Auth Token <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={authToken}
                onChange={e => setAuthToken(e.target.value)}
                placeholder="Your Twilio Auth Token"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors font-mono text-sm"
              />
            </div>

            {/* Advanced: API Key */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced: API Key (required for Voice & Video calling)
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-4 pl-4 border-l border-zinc-700">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">API Key SID</label>
                    <input
                      type="text"
                      value={apiKeySid}
                      onChange={e => setApiKeySid(e.target.value)}
                      placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">API Key Secret</label>
                    <input
                      type="password"
                      value={apiKeySecret}
                      onChange={e => setApiKeySecret(e.target.value)}
                      placeholder="API Key Secret"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !accountSid || !authToken}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verifying credentials...
                </>
              ) : "Connect Twilio Account"}
            </button>
          </form>

          {/* Where to find credentials */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">Where to find your credentials:</p>
            <a
              href="https://console.twilio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Twilio Console → Dashboard (copy Account SID &amp; Auth Token)
            </a>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-zinc-600 mt-4">
          Your credentials are encrypted with AES-256-GCM before storage. We never store plaintext tokens.
        </p>
      </div>
    </div>
  );
}
