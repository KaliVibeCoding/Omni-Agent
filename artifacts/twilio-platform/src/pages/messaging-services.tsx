import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RefreshCw, Webhook, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function MessagingServices() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ["messaging-services"],
    queryFn: () => fetch("/api/twilio/messaging-services").then(res => res.json()),
  });

  const { data: numbers } = useQuery({
    queryKey: ["messaging-service-numbers", expanded],
    queryFn: () => fetch(`/api/twilio/messaging-services/${expanded}/phone-numbers`).then(res => res.json()),
    enabled: !!expanded,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messaging Services</h1>
          <p className="text-muted-foreground mt-1">Manage your Twilio Messaging Services and their phone numbers.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : services?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No messaging services found</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {services?.map((svc: any) => (
            <Card key={svc.sid} className="border-border">
              <CardContent className="py-4 px-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{svc.friendlyName}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{svc.sid}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.dateCreated && (
                      <span className="text-xs text-muted-foreground">
                        Created {format(new Date(svc.dateCreated), "MMM d, yyyy")}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={expanded === svc.sid ? "secondary" : "outline"}
                      onClick={() => setExpanded(expanded === svc.sid ? null : svc.sid)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {expanded === svc.sid ? "Hide Numbers" : "View Numbers"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {svc.inboundRequestUrl && (
                    <div>
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <Webhook className="h-3 w-3" /> Inbound URL
                      </span>
                      <p className="font-mono text-xs mt-1 truncate" title={svc.inboundRequestUrl}>{svc.inboundRequestUrl}</p>
                    </div>
                  )}
                  {svc.fallbackUrl && (
                    <div>
                      <span className="text-muted-foreground text-xs">Fallback URL</span>
                      <p className="font-mono text-xs mt-1 truncate" title={svc.fallbackUrl}>{svc.fallbackUrl}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {svc.mmsConverter && <Badge variant="outline" className="text-xs">MMS Converter</Badge>}
                  {svc.smartEncoding && <Badge variant="outline" className="text-xs">Smart Encoding</Badge>}
                  {svc.stickySession && <Badge variant="outline" className="text-xs">Sticky Session</Badge>}
                </div>
                {expanded === svc.sid && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Phone Numbers</div>
                      {!numbers ? (
                        <Skeleton className="h-10 w-full" />
                      ) : numbers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No numbers assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {numbers.map((n: any) => (
                            <Badge key={n.sid} variant="secondary" className="font-mono">{n.phoneNumber}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
