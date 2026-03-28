import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { getLevelName, getLevelEmoji } from "@/hooks/useLearningStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, ArrowLeft, Phone, Video, MoreVertical,
  Image as ImageIcon, Mic, Smile, Gift, Shield, Flag, UserX, Clock, Check, CheckCheck, MessageCircle, Heart
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { calculateCompatibilityBreakdown, type CompatibilityBreakdownResult } from "@/lib/compatibility";
import { CompatibilityBreakdown } from "@/components/discovery/CompatibilityBreakdown";

type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PublicProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  profile_image: string | null;
  pronouns: string | null;
  [key: string]: any;
}

interface EnhancedMessage extends Message {
  read?: boolean;
  delivered?: boolean;
}

// Icebreaker generation
function generateIcebreakers(currentUser: Profile | null, otherUser: PublicProfile | null): string[] {
  const suggestions: string[] = [];

  if (currentUser && otherUser) {
    const myStyle = (currentUser.relationship_style || "").toLowerCase();
    const theirStyle = (otherUser.relationship_style || "").toLowerCase();
    const enmTerms = ["enm", "polyamor", "non-monogam", "open relationship"];

    if (enmTerms.some(t => myStyle.includes(t) && theirStyle.includes(t))) {
      suggestions.push("What's your current relationship structure like?");
    }

    const myInterests = currentUser.interests || [];
    const theirInterests = otherUser.interests || [];
    const shared = myInterests.filter((i: string) => theirInterests.includes(i));
    if (shared.length > 0) {
      suggestions.push(`I see we both like ${shared.slice(0, 2).join(" and ")}! What got you into ${shared[0]}?`);
    }
  }

  // Fill with generic fallbacks
  const fallbacks = [
    "What brought you to Positive Thots?",
    "What's your favourite module so far?",
    "What does ethical non-monogamy mean to you personally?",
    "How do you prefer to communicate boundaries in new connections?",
  ];
  for (const f of fallbacks) {
    if (suggestions.length >= 3) break;
    if (!suggestions.includes(f)) suggestions.push(f);
  }

  return suggestions.slice(0, 3);
}

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { playMessage } = useSoundEffects();
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [otherUser, setOtherUser] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<"online" | "away" | "offline">("offline");
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSendTimestamp = useRef<number>(0);

  const icebreakers = useMemo(() => generateIcebreakers(currentUser, otherUser), [currentUser, otherUser]);

  useEffect(() => {
    loadChatData();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const loadChatData = async () => {
    if (!matchId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    // Check if user has the Consent badge (first Foundation module)
    const { data: consentModule } = await supabase
      .from("education_modules")
      .select("id")
      .eq("slug", "consent-basics")
      .single();

    if (consentModule) {
      const { data: badge } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("module_id", consentModule.id)
        .maybeSingle();

      if (!badge) {
        toast.error("Complete the Consent badge to unlock messaging 💬", {
          description: "Learn about consent basics first — it only takes a few minutes.",
          action: { label: "Start Learning", onClick: () => navigate("/learn") },
          duration: 8000,
        });
        navigate("/messages");
        return;
      }
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (!profile) return;
    setCurrentUser(profile);

    const { data: match } = await supabase.from("matches").select("user1_id, user2_id").eq("id", matchId).single();
    if (!match) { toast.error("Match not found"); navigate("/messages"); return; }

    const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
    const { data: otherProfileData } = await supabase.rpc("get_public_profile", { _user_id: otherUserId });
    const otherProfile = otherProfileData?.[0] || null;

    if (otherProfile) {
      setOtherUser(otherProfile);
    }

    const { data: existingMessages } = await supabase
      .from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });

    if (existingMessages) {
      setMessages(existingMessages.map(msg => ({
        ...msg, read: msg.sender_id === session.user.id, delivered: true,
      })));
    }

    const channel = supabase.channel(`chat:${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== currentUser?.id) playMessage();
          setMessages(prev => [...prev, { ...newMsg, delivered: true, read: newMsg.sender_id === session.user.id }]);
        })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserPresent = Object.keys(state).some(key => key !== session.user.id);
        setOnlineStatus(otherUserPresent ? "online" : "offline");
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== session.user.id) setIsTyping(payload.isTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ user: session.user.id, online_at: new Date().toISOString() });
      });

    channelRef.current = channel;
    setLoading(false);
  };

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentUser || !matchId) return;

    // 500ms debounce
    const now = Date.now();
    if (now - lastSendTimestamp.current < 500) return;
    lastSendTimestamp.current = now;

    const messageContent = newMessage.trim();
    setNewMessage("");
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, isTyping: false } });
    }

    // Moderate message before sending
    try {
      const { data: modResult, error: modError } = await supabase.functions.invoke('moderate-message', {
        body: { content: messageContent, sender_id: currentUser.id, match_id: matchId },
      });

      // Handle rate limiting
      if (modError) {
        const errorBody = typeof modError === 'object' && modError !== null ? (modError as any) : {};
        if (errorBody.status === 429 || (typeof modError === 'string' && modError.includes('429'))) {
          toast.error("Slow down — you're sending too quickly.");
          setNewMessage(messageContent);
          return;
        }
      }

      if (modResult?.error && modResult.error.includes("Sending too fast")) {
        toast.error("Slow down — you're sending too quickly.");
        setNewMessage(messageContent);
        return;
      }

      if (modResult?.verdict === 'flagged') {
        await supabase.from("flagged_messages").insert({
          match_id: matchId,
          sender_id: currentUser.id,
          content: messageContent,
          reason: modResult.reason || 'Flagged by content filter',
        });
        toast.error("Message blocked", { description: "Your message was flagged by our content filter. Please keep conversations respectful." });
        return;
      }
    } catch (e) {
      // Fail open — if moderation errors, allow the message
      console.error("Moderation check failed:", e);
    }

    const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: currentUser.id, content: messageContent });
    if (error) { console.error("Error sending message:", error); toast.error("Failed to send message"); setNewMessage(messageContent); }
    else {
      trackEvent("message_sent", { match_id: matchId });
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.sender_id === currentUser.id && !msg.read ? { ...msg, read: true } : msg));
      }, 2000 + Math.random() * 3000);
    }
  }, [newMessage, currentUser, matchId]);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (!channelRef.current || !currentUser) return;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, isTyping: value.length > 0 } });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, isTyping: false } });
      }, 2000);
    }
  };

  const [reportReason, setReportReason] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [compatBreakdown, setCompatBreakdown] = useState<CompatibilityBreakdownResult | null>(null);

  const handleViewCompatibility = useCallback(async () => {
    if (!currentUser || !otherUser) return;
    // Get badge counts for both users
    const [{ count: myBadges }, { count: theirBadges }] = await Promise.all([
      supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", currentUser.id),
      supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", otherUser.id),
    ]);
    const bd = calculateCompatibilityBreakdown(currentUser as any, otherUser as any, myBadges || 0, theirBadges || 0);
    setCompatBreakdown(bd);
    setShowCompatibility(true);
  }, [currentUser, otherUser]);

  const REPORT_REASONS = [
    "Harassment or bullying",
    "Inappropriate or explicit content",
    "Spam or scam",
    "Fake profile or impersonation",
    "Threatening behavior",
    "Underage user",
    "Other",
  ];

  const handleReport = async (reason: string, details?: string) => {
    if (!currentUser || !otherUser) return;
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: currentUser.id,
        reported_user_id: otherUser.id,
        reason,
        details: details || null,
      });
      if (error) throw error;
      toast.success("Report Submitted", { description: "Our team will review this. Thank you for keeping the community safe." });
      setShowReportDialog(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !otherUser) return;
    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: currentUser.id,
        blocked_id: otherUser.id,
      });
      if (error && !error.message.includes("duplicate")) throw error;
      toast.success("User Blocked", { description: "You won't see this user anymore." });
      navigate("/messages");
    } catch (err: any) {
      toast.error(err.message || "Failed to block user");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatLastSeen = (date: Date | null) => {
    if (!date) return "Recently active";
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return "Recently active";
  };

  const handleIcebreakerTap = (text: string, index: number) => {
    setNewMessage(text);
    trackEvent('icebreaker_tapped', { suggestion_index: index });
  };

  if (loading) {
    return <PageSkeleton variant="chat" />;
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/messages")} aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {otherUser.profile_image ? (
                      <img src={otherUser.profile_image} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold">{otherUser.name?.[0] || "?"}</span>
                    )}
                  </div>
                  {onlineStatus === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{otherUser.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {otherUser.learning_level && otherUser.learning_level > 1 && (
                      <span>{getLevelName(otherUser.learning_level)} {getLevelEmoji(otherUser.learning_level)}</span>
                    )}
                    {otherUser.learning_level && otherUser.learning_level > 1 && otherUser.pronouns && <span> · </span>}
                    {otherUser.pronouns && <span>{otherUser.pronouns}</span>}
                    {!otherUser.learning_level || otherUser.learning_level <= 1 ? (
                      onlineStatus === "online" ? <span className="text-success">Active now</span> : <span>{formatLastSeen(lastSeen)}</span>
                    ) : (
                      <span className="ml-1">· {onlineStatus === "online" ? <span className="text-success">Active now</span> : formatLastSeen(lastSeen)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleViewCompatibility} aria-label="View compatibility" title="View Compatibility">
                <Heart className="h-5 w-5 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Voice call"><Phone className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Video call"><Video className="h-5 w-5" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="More options"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="sm:hidden"><Phone className="h-4 w-4 mr-2" />Voice Call</DropdownMenuItem>
                  <DropdownMenuItem className="sm:hidden"><Video className="h-4 w-4 mr-2" />Video Call</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}><Flag className="h-4 w-4 mr-2" />Report</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlock} className="text-destructive focus:text-destructive"><UserX className="h-4 w-4 mr-2" />Block User</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      {messages.length === 0 && (
        <div className="container max-w-4xl mx-auto px-4 py-4 space-y-3">
          <Card className="p-4 bg-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Stay Safe</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Never share personal information like your address or financial details. Report any concerning behavior immediately.
                </p>
              </div>
            </div>
          </Card>

          {/* Icebreaker suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" />
              Start the conversation
            </p>
            <div className="flex flex-wrap gap-2">
              {icebreakers.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleIcebreakerTap(text, i)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {messages.map((message, idx) => {
              const isOwn = message.sender_id === currentUser?.id;
              const showTimestamp = idx === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 300000;

              return (
                <div key={message.id}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{formatTime(message.created_at)}</Badge>
                    </div>
                  )}
                  <div className={cn("flex", isOwn ? "justify-end" : "justify-start", isOwn ? "animate-slide-in-right-msg" : "animate-slide-in-left")}>
                    <div className={cn("flex items-end gap-2 max-w-[75%]", isOwn ? "flex-row-reverse" : "flex-row")}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                          {otherUser.profile_image ? (
                            <img src={otherUser.profile_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">{otherUser.name?.[0]}</div>
                          )}
                        </div>
                      )}
                      <div className={cn("relative px-4 py-2.5 rounded-2xl",
                        isOwn ? "bg-gradient-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        {isOwn && (
                          <div className="flex justify-end items-center gap-1 mt-1">
                            <span className="text-xs opacity-70">{formatTime(message.created_at)}</span>
                            {message.delivered && (message.read ? <CheckCheck className="h-3 w-3 opacity-70" /> : <Check className="h-3 w-3 opacity-70" />)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-end gap-2 animate-slide-in-left">
                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                  {otherUser.profile_image ? (
                    <img src={otherUser.profile_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm">{otherUser.name?.[0]}</div>
                  )}
                </div>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-typing-wave" />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-typing-wave" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-typing-wave" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Attach image"><ImageIcon className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 hidden sm:flex" aria-label="Send gift"><Gift className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="pr-10 focus-glow"
                maxLength={1000}
              />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" aria-label="Emoji picker">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            {newMessage.trim() ? (
              <Button
                size="icon" aria-label="Send message"
                onClick={handleSendMessage}
                className={cn("h-10 w-10 bg-gradient-primary text-primary-foreground transition-all", newMessage.trim() && "animate-pulse-glow")}
              >
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Voice message"><Mic className="h-5 w-5" /></Button>
            )}
          </div>
          {newMessage.length > 800 && (
            <div className="text-xs text-muted-foreground text-right mt-1">{newMessage.length}/1000</div>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report {otherUser?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Select a reason for your report. Our team will review it within 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            {REPORT_REASONS.map((reason) => (
              <Button
                key={reason}
                variant={reportReason === reason ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setReportReason(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setReportReason(""); }}>Cancel</AlertDialogCancel>
            <Button
              disabled={!reportReason}
              onClick={() => handleReport(reportReason)}
              variant="destructive"
            >
              Submit Report
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

      {/* Compatibility Breakdown Sheet */}
      <Sheet open={showCompatibility} onOpenChange={setShowCompatibility}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Compatibility</SheetTitle>
          </SheetHeader>
          {compatBreakdown && (
            <CompatibilityBreakdown
              breakdown={compatBreakdown}
              otherName={otherUser?.name || ""}
              onCopyIcebreaker={(text) => {
                setNewMessage(text);
                setShowCompatibility(false);
              }}
              className="pb-6"
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Chat;
