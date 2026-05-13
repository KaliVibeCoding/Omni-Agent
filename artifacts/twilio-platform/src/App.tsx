import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { useMasterAdmin } from "@/hooks/use-api";

import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import ConnectPage from "@/pages/connect";
import Dashboard from "@/pages/dashboard";
import SmsCenter from "@/pages/sms";
import Calls from "@/pages/calls";
import PhoneNumbers from "@/pages/phone-numbers";
import Lookup from "@/pages/lookup";
import Voicemails from "@/pages/voicemails";
import Usage from "@/pages/usage";
import Alerts from "@/pages/alerts";
import Verify from "@/pages/verify";
import MessagingServices from "@/pages/messaging-services";
import Studio from "@/pages/studio";
import Queues from "@/pages/queues";
import Conferences from "@/pages/conferences";
import Contacts from "@/pages/contacts";
import Settings from "@/pages/settings";
import VideoRooms from "@/pages/video";
import Conversations from "@/pages/conversations";
import Telehealth from "@/pages/telehealth";
import BillingPage from "@/pages/billing";
import EmailCampaigns from "@/pages/email-campaigns";
import AGIFramework from "@/pages/agi-framework";
import AdminPanel from "@/pages/admin";
import Integrations from "@/pages/integrations";
import NichesHub from "@/pages/niches-hub";
import NicheLanding from "@/pages/niche-landing";
import NicheDashboard from "@/pages/niche-dashboard";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(348 83% 47%)",
    colorForeground: "hsl(210 40% 98%)",
    colorMutedForeground: "hsl(215 20% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(222 47% 8%)",
    colorInput: "hsl(222 47% 13%)",
    colorInputForeground: "hsl(210 40% 98%)",
    colorNeutral: "hsl(215 28% 22%)",
    fontFamily: "'JetBrains Mono', monospace",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !rounded-none",
    footer: "!shadow-none !border-0 !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-slate-300 text-xs font-semibold uppercase tracking-wider",
    footerActionLink: "text-red-400 hover:text-red-300 font-semibold",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-red-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border-slate-700 hover:border-slate-500 bg-slate-800 hover:bg-slate-700",
    formButtonPrimary: "font-bold tracking-wide",
    formFieldInput: "bg-slate-800 border-slate-700 text-white focus:border-red-500",
    footerAction: "bg-transparent",
    dividerLine: "bg-slate-700",
    alert: "bg-slate-800 border-slate-700",
    otpCodeFieldInput: "bg-slate-800 border-slate-700 text-white",
    formFieldRow: "gap-3",
    main: "px-2",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: "hsl(222 47% 6%)" }}
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: "hsl(222 47% 6%)" }}
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function useHasTwilioCredentials() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = React.useState<"loading" | "connected" | "missing">("loading");
  React.useEffect(() => {
    if (!isSignedIn) {
      setStatus("missing");
      return;
    }
    apiFetch<{ connected: boolean }>("/api/tenant/credentials", { getToken: () => getToken() })
      .then((d) => setStatus(d.connected ? "connected" : "missing"))
      .catch(() => setStatus("missing"));
  }, [getToken, isSignedIn]);
  return status;
}

/**
 * Bridges Clerk's getToken() into the generated workspace API client.
 * Mounted once inside ClerkProvider so every useGetX() hook automatically
 * sends `Authorization: Bearer <session-token>`.
 */
function ApiAuthBridge() {
  const { getToken, isSignedIn } = useAuth();
  React.useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(async () => {
        try { return await getToken(); } catch { return null; }
      });
    } else {
      setAuthTokenGetter(null);
    }
    return () => setAuthTokenGetter(null);
  }, [getToken, isSignedIn]);
  return null;
}

function ProtectedRoute({
  component: Component,
  requireAdmin = false,
}: {
  component: React.ComponentType;
  requireAdmin?: boolean;
}) {
  const credStatus = useHasTwilioCredentials();
  const { isMasterAdmin, loading: adminLoading } = useMasterAdmin();

  // Master admin always bypasses the Twilio "connect" gate
  const effectiveStatus = isMasterAdmin ? "connected" : credStatus;

  return (
    <>
      <Show when="signed-in">
        {adminLoading || effectiveStatus === "loading" ? null : requireAdmin && !isMasterAdmin ? (
          <Layout>
            <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Admin Access Required</h2>
              <p className="text-muted-foreground text-sm">
                This area is restricted to platform administrators.
              </p>
            </div>
          </Layout>
        ) : effectiveStatus === "missing" ? (
          <Redirect to="/connect" />
        ) : (
          <Layout>
            <Component />
          </Layout>
        )}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/connect" component={() => (
        <>
          <Show when="signed-in"><ConnectPage /></Show>
          <Show when="signed-out"><Redirect to="/" /></Show>
        </>
      )} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/sms" component={() => <ProtectedRoute component={SmsCenter} />} />
      <Route path="/calls" component={() => <ProtectedRoute component={Calls} />} />
      <Route path="/phone-numbers" component={() => <ProtectedRoute component={PhoneNumbers} />} />
      <Route path="/lookup" component={() => <ProtectedRoute component={Lookup} />} />
      <Route path="/voicemails" component={() => <ProtectedRoute component={Voicemails} />} />
      <Route path="/usage" component={() => <ProtectedRoute component={Usage} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={Alerts} />} />
      <Route path="/verify" component={() => <ProtectedRoute component={Verify} />} />
      <Route path="/messaging-services" component={() => <ProtectedRoute component={MessagingServices} />} />
      <Route path="/studio" component={() => <ProtectedRoute component={Studio} />} />
      <Route path="/queues" component={() => <ProtectedRoute component={Queues} />} />
      <Route path="/conferences" component={() => <ProtectedRoute component={Conferences} />} />
      <Route path="/contacts" component={() => <ProtectedRoute component={Contacts} />} />
      <Route path="/video" component={() => <ProtectedRoute component={VideoRooms} />} />
      <Route path="/conversations" component={() => <ProtectedRoute component={Conversations} />} />
      <Route path="/telehealth" component={() => <ProtectedRoute component={Telehealth} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/billing" component={() => <ProtectedRoute component={BillingPage} />} />
      <Route path="/email-campaigns" component={() => <ProtectedRoute component={EmailCampaigns} />} />
      <Route path="/agi-framework" component={() => <ProtectedRoute component={AGIFramework} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPanel} requireAdmin />} />
      <Route path="/integrations" component={() => <ProtectedRoute component={Integrations} />} />
      <Route path="/niches" component={NichesHub} />
      <Route path="/niches/:slug" component={NicheLanding} />
      <Route path="/niche/:slug" component={() => <ProtectedRoute component={NicheDashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your portal",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with RJ Business Solutions",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ApiAuthBridge />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
