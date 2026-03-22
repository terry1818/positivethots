import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquareWarning, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";

interface FlaggedMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  reason: string | null;
  status: string;
  created_at: string;
}

export const ModerationTab = () => {
  const [messages, setMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("flagged_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setMessages((data as any[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("flagged_messages")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: session?.user.id } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Message ${status}`);
      loadMessages();
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const pendingCount = messages.filter(m => m.status === "pending").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-destructive" />
          Moderation Queue
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingCount}</Badge>
          )}
        </h3>
        <Button variant="ghost" size="sm" onClick={loadMessages} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No flagged messages ✅</p>
      ) : (
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Time</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="w-[120px]">Reason</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{msg.content}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{msg.reason || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={msg.status === "pending" ? "destructive" : msg.status === "dismissed" ? "secondary" : "default"}>
                      {msg.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {msg.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(msg.id, "dismissed")}>
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateStatus(msg.id, "confirmed")}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
};
