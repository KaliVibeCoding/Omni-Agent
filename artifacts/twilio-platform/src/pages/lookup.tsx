import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle } from "lucide-react";

export default function Lookup() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/twilio/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, fields: ["line_type_intelligence", "caller_name"] }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Number Lookup</h1>
        <p className="text-muted-foreground mt-1">Look up carrier, line type, and caller info for any phone number.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Lookup</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex gap-3">
            <Input
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="flex-1 font-mono"
            />
            <Button type="submit" disabled={loading || !phoneNumber}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Looking up..." : "Lookup"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="font-mono text-xl">{result.nationalFormat || result.phoneNumber}</span>
              {result.valid ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Invalid
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">E.164 Format</Label>
                <p className="font-mono mt-1">{result.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Country Code</Label>
                <p className="mt-1">{result.countryCode || "—"}</p>
              </div>
            </div>

            {result.lineTypeIntelligence && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Line Type Intelligence</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="capitalize mt-1">{result.lineTypeIntelligence.type?.replace(/_/g, " ") || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mobile Country Code</Label>
                      <p className="mt-1">{result.lineTypeIntelligence.mobile_country_code || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mobile Network Code</Label>
                      <p className="mt-1">{result.lineTypeIntelligence.mobile_network_code || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Carrier Name</Label>
                      <p className="mt-1">{result.lineTypeIntelligence.carrier_name || "—"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {result.callerName && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Caller Name</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="mt-1">{result.callerName.caller_name || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Caller Type</Label>
                      <p className="capitalize mt-1">{result.callerName.caller_type || "—"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
