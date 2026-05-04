import React, { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/sms" component={SmsCenter} />
        <Route path="/calls" component={Calls} />
        <Route path="/phone-numbers" component={PhoneNumbers} />
        <Route path="/lookup" component={Lookup} />
        <Route path="/voicemails" component={Voicemails} />
        <Route path="/usage" component={Usage} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/verify" component={Verify} />
        <Route path="/messaging-services" component={MessagingServices} />
        <Route path="/studio" component={Studio} />
        <Route path="/queues" component={Queues} />
        <Route path="/conferences" component={Conferences} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
