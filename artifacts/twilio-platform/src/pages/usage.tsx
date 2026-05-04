import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, RefreshCw } from "lucide-react";

export default function Usage() {
  const { data: today, isLoading: todayLoading, refetch: refetchToday } = useQuery({
    queryKey: ["usage-today"],
    queryFn: () => fetch("/api/twilio/usage/today").then(res => res.json()),
  });

  const { data: thisMonth, isLoading: monthLoading, refetch: refetchMonth } = useQuery({
    queryKey: ["usage-month"],
    queryFn: () => fetch("/api/twilio/usage/thismonth").then(res => res.json()),
  });

  const totalCost = (records: any[]) =>
    records?.reduce((sum: number, r: any) => sum + parseFloat(r.price || "0"), 0).toFixed(4);

  const UsageTable = ({ records, loading }: { records: any[]; loading: boolean }) => (
    loading ? (
      <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
    ) : !records?.length ? (
      <div className="text-center py-12 text-muted-foreground">No usage records found</div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Usage</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records?.filter((r: any) => parseFloat(r.price || "0") > 0 || parseInt(r.count || "0") > 0)
            .sort((a: any, b: any) => parseFloat(b.price || "0") - parseFloat(a.price || "0"))
            .map((record: any, i: number) => (
              <TableRow key={i}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs capitalize">
                    {record.category?.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{record.description}</TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {record.count} {record.countUnit}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {record.usage} {record.usageUnit}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {parseFloat(record.price || "0") > 0 ? (
                    <span className="text-foreground">${parseFloat(record.price).toFixed(4)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    )
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage & Billing</h1>
          <p className="text-muted-foreground mt-1">Track your Twilio usage costs and consumption.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Today's Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">${totalCost(today || [])}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> This Month's Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">${totalCost(thisMonth || [])}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="today">
          <CardHeader>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
              <Button size="sm" variant="ghost" onClick={() => { refetchToday(); refetchMonth(); }}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="today" className="m-0">
              <UsageTable records={today} loading={todayLoading} />
            </TabsContent>
            <TabsContent value="month" className="m-0">
              <UsageTable records={thisMonth} loading={monthLoading} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
