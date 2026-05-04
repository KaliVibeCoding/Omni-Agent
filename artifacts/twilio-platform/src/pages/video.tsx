import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Video, Users, StopCircle, Key, RefreshCw, Copy, Plus } from "lucide-react";

type Room = {
  sid: string;
  uniqueName: string;
  status: string;
  type: string;
  maxParticipants: number;
  dateCreated: string;
  endTime?: string;
  duration?: number;
};

type Participant = {
  sid: string;
  identity: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
};

const statusColor: Record<string, string> = {
  "in-progress": "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function VideoRooms() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [participantsRoom, setParticipantsRoom] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({ uniqueName: "", type: "go", maxParticipants: "10" });
  const [tokenForm, setTokenForm] = useState({ identity: "", roomName: "" });
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const { data: activeRooms = [], isLoading: activeLoading, refetch: refetchActive } = useQuery<Room[]>({
    queryKey: ["video-rooms-active"],
    queryFn: () => fetch("/api/twilio/video/rooms?status=in-progress").then(r => r.json()),
    refetchInterval: 10000,
  });

  const { data: completedRooms = [], isLoading: completedLoading } = useQuery<Room[]>({
    queryKey: ["video-rooms-completed"],
    queryFn: () => fetch("/api/twilio/video/rooms?status=completed&limit=20").then(r => r.json()),
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ["video-participants", participantsRoom],
    queryFn: () => participantsRoom
      ? fetch(`/api/twilio/video/rooms/${participantsRoom}/participants`).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!participantsRoom,
  });

  const createRoom = useMutation({
    mutationFn: (data: typeof newRoom) =>
      fetch("/api/twilio/video/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, maxParticipants: parseInt(data.maxParticipants) }),
      }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => {
      toast({ title: "Room created" });
      setCreateOpen(false);
      setNewRoom({ uniqueName: "", type: "go", maxParticipants: "10" });
      qc.invalidateQueries({ queryKey: ["video-rooms-active"] });
    },
    onError: () => toast({ title: "Failed to create room", variant: "destructive" }),
  });

  const endRoom = useMutation({
    mutationFn: (sid: string) =>
      fetch(`/api/twilio/video/rooms/${sid}/end`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Room ended" });
      qc.invalidateQueries({ queryKey: ["video-rooms-active"] });
      qc.invalidateQueries({ queryKey: ["video-rooms-completed"] });
    },
    onError: () => toast({ title: "Failed to end room", variant: "destructive" }),
  });

  const generateToken = useMutation({
    mutationFn: (data: typeof tokenForm) =>
      fetch("/api/twilio/video/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setGeneratedToken(data.token);
      toast({ title: "Token generated" });
    },
    onError: () => toast({ title: "Failed to generate token", variant: "destructive" }),
  });

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast({ title: "Token copied to clipboard" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="size-6 text-primary" /> Video Rooms
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Twilio Programmable Video — telehealth & collaboration sessions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchActive()}>
            <RefreshCw className="size-4 mr-1" /> Refresh
          </Button>
          <Dialog open={tokenOpen} onOpenChange={setTokenOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Key className="size-4 mr-1" /> Get Token</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate Video Access Token</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Identity (participant name/ID)</Label>
                  <Input value={tokenForm.identity} onChange={e => setTokenForm(f => ({ ...f, identity: e.target.value }))} placeholder="patient_123 or dr_smith" className="mt-1" />
                </div>
                <div>
                  <Label>Room Name (optional)</Label>
                  <Input value={tokenForm.roomName} onChange={e => setTokenForm(f => ({ ...f, roomName: e.target.value }))} placeholder="consultation-room-1" className="mt-1" />
                </div>
                {generatedToken && (
                  <div>
                    <Label>Access Token</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={generatedToken.slice(0, 40) + "..."} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="sm" onClick={copyToken}><Copy className="size-4" /></Button>
                    </div>
                  </div>
                )}
                <Button className="w-full" onClick={() => generateToken.mutate(tokenForm)} disabled={!tokenForm.identity || generateToken.isPending}>
                  Generate Token
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" /> New Room</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Video Room</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Room Name (Unique Name)</Label>
                  <Input value={newRoom.uniqueName} onChange={e => setNewRoom(r => ({ ...r, uniqueName: e.target.value }))} placeholder="patient-dr-smith-may2026" className="mt-1" />
                </div>
                <div>
                  <Label>Room Type</Label>
                  <Select value={newRoom.type} onValueChange={v => setNewRoom(r => ({ ...r, type: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="go">Go (2 participants, free)</SelectItem>
                      <SelectItem value="group">Group (up to 50)</SelectItem>
                      <SelectItem value="peer-to-peer">Peer-to-Peer (2 participants)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Participants</Label>
                  <Input type="number" min={2} max={50} value={newRoom.maxParticipants} onChange={e => setNewRoom(r => ({ ...r, maxParticipants: e.target.value }))} className="mt-1" />
                </div>
                <Button className="w-full" onClick={() => createRoom.mutate(newRoom)} disabled={createRoom.isPending}>
                  {createRoom.isPending ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rooms</p>
                <p className="text-3xl font-bold text-green-400">{activeRooms.length}</p>
              </div>
              <Video className="size-8 text-green-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-3xl font-bold">{completedRooms.length}</p>
              </div>
              <StopCircle className="size-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Rooms ({activeRooms.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRooms.length})</TabsTrigger>
          {participantsRoom && <TabsTrigger value="participants">Participants</TabsTrigger>}
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader><CardTitle>Live Rooms</CardTitle><CardDescription>Currently in-progress video sessions</CardDescription></CardHeader>
            <CardContent>
              {activeLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : activeRooms.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active rooms. Create one to start a telehealth session.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>SID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRooms.map(room => (
                      <TableRow key={room.sid}>
                        <TableCell className="font-medium">{room.uniqueName || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{room.type}</Badge></TableCell>
                        <TableCell>
                          <Badge className={statusColor[room.status] ?? ""}>{room.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {room.dateCreated ? new Date(room.dateCreated).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{room.sid}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setParticipantsRoom(room.sid)}>
                              <Users className="size-3 mr-1" /> Participants
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => endRoom.mutate(room.sid)}>
                              <StopCircle className="size-3 mr-1" /> End
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader><CardTitle>Completed Rooms</CardTitle></CardHeader>
            <CardContent>
              {completedLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : completedRooms.length === 0 ? (
                <p className="text-muted-foreground text-sm">No completed rooms found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>SID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedRooms.map(room => (
                      <TableRow key={room.sid}>
                        <TableCell className="font-medium">{room.uniqueName || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{room.type}</Badge></TableCell>
                        <TableCell>{room.duration ? `${room.duration}s` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {room.dateCreated ? new Date(room.dateCreated).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{room.sid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {participantsRoom && (
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Participants — {participantsRoom}</CardTitle>
                <CardDescription>Current participants in this room</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No participants connected yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map(p => (
                        <TableRow key={p.sid}>
                          <TableCell className="font-medium">{p.identity}</TableCell>
                          <TableCell><Badge className={p.status === "connected" ? "bg-green-500/20 text-green-400" : ""}>{p.status}</Badge></TableCell>
                          <TableCell>{p.duration ? `${p.duration}s` : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.startTime ? new Date(p.startTime).toLocaleString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
