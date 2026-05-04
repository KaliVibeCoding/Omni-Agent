import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RefreshCw, AlertTriangle, Info, XCircle } from "lucide-react";

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ["twilio-alerts"],
    queryFn: () => fetch("/api/twilio/alerts").then(res => res.json()),
    refetchInterval: 30000,
  });

  const getLogLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "error": return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Error</Badge>;
      case "warning": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
      default: return <Badge variant="outline" className="flex items-center gap-1"><Info className="h-3 w-3" /> {level || "Info"}</Badge>;
    }
  };

  const errorCount = alerts?.filter((a: any) => a.logLevel?.toLowerCase() === "error").length || 0;
  const warningCount = alerts?.filter((a: any) => a.logLevel?.toLowerCase() === "warning").length || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">Twilio Monitor alerts and error logs.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 px-5">
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Warnings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alert Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !alerts?.length ? (
            <div className="text-center py-12 text-muted-foreground">No alerts found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts?.map((alert: any) => (
                  <TableRow key={alert.sid}>
                    <TableCell>{getLogLevelBadge(alert.logLevel)}</TableCell>
                    <TableCell className="font-mono text-sm">{alert.errorCode || "—"}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={alert.alertText}>{alert.alertText}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={alert.requestUrl}>
                      {alert.requestUrl || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {alert.dateCreated ? format(new Date(alert.dateCreated), "MMM d, h:mm a") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
