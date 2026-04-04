import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupMessages, useGroupMembers, type GroupMessage } from "@/hooks/useGroupChats";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Send, Users, Loader2, UserPlus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GroupChatViewProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
}

export const GroupChatView = ({ groupId, groupName, onBack }: GroupChatViewProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading: messagesLoading } = useGroupMessages(groupId);
  const { members, isAdmin } = useGroupMembers(groupId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("group_messages").insert({
        group_id: groupId,
        sender_id: user.id,
        content: input.trim(),
        message_type: "text",
      });
      if (error) throw error;
      setInput("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleLeave = async () => {
    const { error } = await supabase
      .from("group_chat_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user!.id);
    if (!error) {
      await supabase.from("group_messages").insert({
        group_id: groupId,
        sender_id: user!.id,
        content: "left the group",
        message_type: "system",
      });
      toast.success("You left the group");
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={() => setShowMembers(true)}
          className="flex-1 text-left min-w-0"
        >
          <p className="font-semibold text-sm truncate">{groupName}</p>
          <p className="text-xs text-muted-foreground">{members.length} members</p>
        </button>
        <Button variant="ghost" size="icon" onClick={() => setShowMembers(true)} aria-label="View members">
          <Users className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messagesLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />
          ))
        ) : (
          (messages || []).map(msg => (
            <MessageBubble key={msg.id} message={msg} isMe={msg.sender_id === user?.id} />
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Members sheet */}
      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Members ({members.length})</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 py-4">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.profile?.profile_image || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(member.profile?.display_name || member.profile?.name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.profile?.display_name || member.profile?.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                </div>
                {isAdmin && member.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs"
                    onClick={async () => {
                      await supabase.from("group_chat_members").delete()
                        .eq("group_id", groupId).eq("user_id", member.user_id);
                      toast.success("Member removed");
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full mt-4 text-destructive" onClick={handleLeave}>
              <LogOut className="h-4 w-4 mr-2" /> Leave Group
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const MessageBubble = ({ message, isMe }: { message: GroupMessage; isMe: boolean }) => {
  if (message.message_type === "system") {
    return (
      <p className="text-xs text-muted-foreground text-center py-1 italic">
        {message.sender_profile?.display_name || message.sender_profile?.name} {message.content}
      </p>
    );
  }

  return (
    <div className={cn("flex gap-2", isMe && "flex-row-reverse")}>
      {!isMe && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarImage src={message.sender_profile?.profile_image || undefined} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary">
            {(message.sender_profile?.display_name || message.sender_profile?.name || "?")[0]}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[75%]", isMe ? "items-end" : "items-start")}>
        {!isMe && (
          <p className="text-xs text-muted-foreground mb-0.5 px-1">
            {message.sender_profile?.display_name || message.sender_profile?.name}
          </p>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm",
            isMe
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
            message.message_type === "opening_move" &&
              "border border-transparent bg-gradient-to-r from-primary/20 to-pink-500/20 ring-1 ring-primary/30"
          )}
        >
          {message.message_type === "opening_move" && (
            <p className="text-[11px] text-primary mb-0.5 font-medium">Opening Move</p>
          )}
          {message.content}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};
