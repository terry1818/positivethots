import { GuideArt } from "@/components/mascot/GuideArt";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { getLevelName } from "@/hooks/useLearningStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  Send, ArrowLeft, MoreVertical, Shield, Flag, UserX, Check, CheckCheck, Heart, BadgeCheck, AlertCircle, UserMinus, FileText, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
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
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { useSessionStore } from "@/stores/sessionStore";
import { ChatGameCard } from "@/components/chat/ChatGameCard";
import { GameMenu } from "@/components/chat/GameMenu";

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
    "What does a good connection look like to you?",
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
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [otherUser, setOtherUser] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<"online" | "away" | "offline">("offline");
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [chatGames, setChatGames] = useState<any[]>([]);
  const [compatBannerDismissed, setCompatBannerDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSendTimestamp = useRef<number>(0);

  const icebreakers = useMemo(() => generateIcebreakers(currentUser, otherUser), [currentUser, otherUser]);

  useEffect(() => {
    loadChatData();
    return () => {
      setIsTyping(false);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId]);

  // Safety timeout: clear typing indicator after 5 seconds of no updates
  useEffect(() => {
    if (!isTyping) return;
    const timeout = setTimeout(() => setIsTyping(false), 5000);
    return () => clearTimeout(timeout);
  }, [isTyping]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // "nearest" keeps the scroll inside the message list; it never moves the page itself.
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" }); };

  const loadChatData = async () => {
    if (!matchId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    // Check if user has the Consent badge (first Foundation module)
    const { data: consentModule } = await supabase
      .from("education_modules")
      .select("id")
      .eq("slug", "consent-basics")
      .maybeSingle();

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

    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (profileError || !profile) { toast.error("Could not load your profile"); navigate("/messages"); return; }
    setCurrentUser(profile);

    const { data: match, error: matchError } = await supabase.from("matches").select("user1_id, user2_id").eq("id", matchId).single();
    if (matchError || !match) { toast.error("Match not found"); navigate("/messages"); return; }

    const otherUserId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
    const { data: otherProfileData } = await supabase.rpc("get_public_profile", { _user_id: otherUserId });
    const otherProfile = otherProfileData?.[0] || null;

    if (otherProfile) {
      setOtherUser(otherProfile);

      // Pre-compute compatibility for banner
      if (!useSessionStore.getState().isBannerDismissed(`compat_banner_${matchId}`)) {
        const [{ count: myB }, { count: theirB }] = await Promise.all([
          supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
          supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", otherUserId),
        ]);
        const bd = calculateCompatibilityBreakdown(profile as any, otherProfile as any, myB || 0, theirB || 0);
        setCompatBreakdown(bd);
      }
    }

    const { data: existingMessages } = await supabase
      .from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });

    if (existingMessages) {
      setMessages(existingMessages.map(msg => ({
        ...msg, read: msg.sender_id === session.user.id, delivered: true,
      })));
    }

    // Load existing games
    const { data: existingGames } = await supabase
      .from("chat_games" as any)
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    if (existingGames) setChatGames(existingGames as any[]);

    const channel = supabase.channel(`chat-${matchId}-${session.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          // Skip if we already have this message (from optimistic insert)
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            if (newMsg.sender_id !== session.user.id) playMessage();
            return [...prev, { ...newMsg, delivered: true, read: newMsg.sender_id === session.user.id }];
          });
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_games', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setChatGames(prev => [...prev, payload.new as any]);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_games', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setChatGames(prev => prev.map(g => g.id === (payload.new as any).id ? payload.new as any : g));
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

    // Check hourly rate limit (30 msgs/hour per match)
    try {
      const { data: rlResult } = await supabase.rpc("check_message_rate_limit", {
        _user_id: currentUser.id,
        _match_id: matchId,
      });
      const rl = rlResult as any;
      if (rl?.limited) {
        const mins = rl.minutes_remaining || 1;
        toast.warning("You're messaging faster than usual", {
          description: `Take a breath — your messages will resume in ${mins} minute${mins === 1 ? '' : 's'}.`,
          duration: 6000,
        });
        return;
      }
    } catch (e) {
      // Fail open if rate limit check errors
      console.error("Rate limit check failed:", e);
    }

    const messageContent = newMessage.trim();
    const optimisticId = `optimistic-${Date.now()}`;
    setNewMessage("");
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, isTyping: false } });
    }

    // Optimistic: immediately show message bubble with "sending" state
    const optimisticMsg: EnhancedMessage = {
      id: optimisticId,
      match_id: matchId,
      sender_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      delivered: false,
      read: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Moderate message before sending — race against 5s timeout
    try {
      const moderatePromise = supabase.functions.invoke('moderate-message', {
        body: { content: messageContent, sender_id: currentUser.id, match_id: matchId },
      });
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "Moderation timed out" } }), 5000)
      );
      const { data: modResult, error: modError } = await Promise.race([moderatePromise, timeoutPromise]);

      // Handle rate limiting
      if (modError) {
        const errorBody = typeof modError === 'object' && modError !== null ? (modError as any) : {};
        if (errorBody.status === 429 || (typeof modError === 'string' && modError.includes('429'))) {
          toast.warning("Take a breath — you're sending too quickly.");
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
          setNewMessage(messageContent);
          return;
        }
        // For other errors (including timeout), fall through to send anyway
        console.warn("Moderation check issue:", modError);
      }

      if (modResult?.error && modResult.error.includes("Sending too fast")) {
        toast.warning("Take a breath — you're sending too quickly.");
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setNewMessage(messageContent);
        return;
      }

      if (modResult?.verdict === 'flagged') {
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
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

    const { data: insertedMsg, error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: currentUser.id, content: messageContent }).select().single();
    if (error) {
      // Mark as failed — keep the bubble but show error state
      console.error("Error sending message:", error);
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: `failed-${Date.now()}`, delivered: false, read: false } : m));
      toast.error("Message didn't send", { description: "Tap the message to retry or delete." });
    } else {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...insertedMsg, delivered: true, read: false } : m));
      trackEvent("message_sent", { match_id: matchId });
      // Simulate read receipt after delay
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
  const [showBlockDialog, setShowBlockDialog] = useState(false);
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
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !otherUser) return;
    let undone = false;
    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: currentUser.id,
        blocked_id: otherUser.id,
      });
      if (error && !error.message.includes("duplicate")) throw error;
      toast.success(`You've blocked ${otherUser.name}`, {
        description: "You won't see each other's profiles or messages anymore.",
        duration: 10000,
        action: {
          label: "Undo",
          onClick: async () => {
            undone = true;
            await supabase.from("blocked_users")
              .delete()
              .eq("blocker_id", currentUser.id)
              .eq("blocked_id", otherUser.id);
            toast.info(`Unblocked ${otherUser.name}`);
          },
        },
      });
      setTimeout(() => { if (!undone) navigate("/messages"); }, 1200);
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  const handleUnmatch = async () => {
    if (!currentUser || !otherUser || !matchId) return;
    try {
      // Delete messages and the match itself; partners are removed for both sides
      await supabase.from("messages").delete().eq("match_id", matchId);
      const { error } = await supabase.from("matches").delete().eq("id", matchId);
      if (error) throw error;
      toast.success(`You've unmatched with ${otherUser.name}.`);
      navigate("/messages");
    } catch (err: any) {
      toast.error("Couldn't unmatch right now. Please try again.");
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
      <div className="kit-area-chat flex min-h-screen flex-col items-center justify-center px-4">
        <BrandedEmptyState
          mascot="confused"
          headline="We couldn't open this conversation."
          description="It may have been removed. Your other conversations are still here."
          ctaLabel="Back to Chat"
          onCtaClick={() => navigate("/messages")}
        />
      </div>
    );
  }

  const level = otherUser.learning_level && otherUser.learning_level > 1 ? getLevelName(otherUser.learning_level) : null;
  const presence = onlineStatus === "online" ? "Active now" : formatLastSeen(lastSeen);
  const score = compatBreakdown?.totalScore;
  const compatKey = `compat_banner_${matchId}`;
  const showCompatBanner = !!score && score > 80 && !(compatBannerDismissed || useSessionStore.getState().isBannerDismissed(compatKey));

  return (
    <div className="kit-area-chat chat-screen">
      {/* Header: who this is, and report and block one tap away. */}
      <header className="kit-header z-30 shrink-0">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-1 px-2 py-1.5">
          <button type="button" className="chat-icon-btn" onClick={() => navigate("/messages")} aria-label="Back to Chat">
            <ArrowLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 text-left"
            onClick={handleViewCompatibility}
            aria-label={`${otherUser.name}. ${presence}. View compatibility`}
          >
            <span className="relative shrink-0">
              <ProfileFrame frameId={(otherUser as any).selected_frame} size="sm">
                <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-muted">
                  {otherUser.profile_image ? (
                    <img src={otherUser.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold">{otherUser.name?.[0] || "?"}</span>
                  )}
                </span>
              </ProfileFrame>
              {onlineStatus === "online" && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1">
                <span className="truncate font-bold leading-tight">{otherUser.name}</span>
                {(otherUser as any).is_verified && <BadgeCheck className="kit-text h-4 w-4 shrink-0" aria-label="Verified" />}
              </span>
              <span className="block truncate text-sm leading-tight text-muted-foreground">
                {onlineStatus === "online" ? <span className="font-semibold text-success">Active now</span> : presence}
                {level ? ` · ${level}` : ""}
              </span>
            </span>
          </button>
          <button type="button" className="chat-icon-btn" onClick={() => setShowReportDialog(true)} aria-label={`Report ${otherUser.name}`}>
            <Flag aria-hidden="true" />
          </button>
          {/* On the narrowest phones Block moves into the menu so the name keeps some room. */}
          <button type="button" className="chat-icon-btn !hidden min-[360px]:!grid" onClick={() => setShowBlockDialog(true)} aria-label={`Block ${otherUser.name}`}>
            <UserX aria-hidden="true" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="chat-icon-btn" aria-label="More options"><MoreVertical aria-hidden="true" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem className="min-h-[44px] min-[360px]:hidden" onClick={() => setShowBlockDialog(true)}>
                <UserX className="mr-2 h-4 w-4" />Block {otherUser.name}
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-[44px]" onClick={handleViewCompatibility}>
                <Heart className="mr-2 h-4 w-4" />View compatibility
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-[44px]" onClick={() => setShowSafetyTips(true)}>
                <Shield className="mr-2 h-4 w-4" />Safety tips
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-[44px]" onClick={() => navigate("/complaints")}>
                <FileText className="mr-2 h-4 w-4" />Complaints Policy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-[44px] text-destructive focus:text-destructive" onClick={() => setShowUnmatchDialog(true)}>
                <UserMinus className="mr-2 h-4 w-4" />Remove connection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages: the only part of the screen that scrolls. */}
      <div className="chat-scroll">
        <div className="mx-auto w-full max-w-4xl px-3 py-4">
          {/* Before the conversation gets going: a safety note and a few ways to start. */}
          {messages.length < 3 && (
            <div className="mb-4 space-y-3">
              {messages.length === 0 && (
                <>
                  <div className="flex justify-center"><GuideArt name="guide-story-chat" size={110} /></div>
                  <p className="text-center text-lg font-extrabold [text-wrap:balance]">You and {otherUser.name} both said yes</p>
                  <div className="kit-card flex items-start gap-3 p-3">
                    <span className="kit-coin" data-tone="urgent"><Shield aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold leading-tight">Stay safe</h2>
                      <p className="text-sm text-muted-foreground [text-wrap:pretty]">
                        Never share your address or financial details. Report anything that worries you.
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div>
                <h2 className="kit-eyebrow px-1">{messages.length === 0 ? "Start the conversation" : "Conversation starters"}</h2>
                <div className="mt-2 grid gap-2">
                  {icebreakers.map((text, i) => (
                    <button key={i} type="button" className="chat-starter" onClick={() => handleIcebreakerTap(text, i)}>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showCompatBanner && (
            <div className="kit-card mb-4 flex items-center gap-2 p-2.5 pl-3.5 text-sm">
              <span className="min-w-0 flex-1">
                You're {score}% compatible.{" "}
                <button type="button" onClick={() => navigate("/events")} className="kit-text font-bold underline underline-offset-2">Find an event to meet at</button>
              </span>
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => { setCompatBannerDismissed(true); useSessionStore.getState().dismissBanner(compatKey); }}
                aria-label="Dismiss"
              >
                <X aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="space-y-2">
            {messages.map((message, idx) => {
              const isOwn = message.sender_id === currentUser?.id;
              const previous = messages[idx - 1];
              const showTimestamp = idx === 0 ||
                new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() > 300000;
              // Their photo sits beside the last bubble of each run of their messages.
              const next = messages[idx + 1];
              const endsRun = !next || next.sender_id !== message.sender_id;
              const failed = isOwn && message.id.startsWith("failed-");
              const sending = isOwn && message.id.startsWith("optimistic-");

              return (
                <div key={message.id}>
                  {showTimestamp && (
                    <div className="chat-day"><span className="kit-chip" data-tone="quiet">{formatTime(message.created_at)}</span></div>
                  )}
                  <div className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start", !prefersReducedMotion && (isOwn ? "animate-slide-in-right-msg" : "animate-slide-in-left"))}>
                    {!isOwn && (
                      <span className={cn("h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted", !endsRun && "invisible")} aria-hidden="true">
                        {otherUser.profile_image ? (
                          <img src={otherUser.profile_image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-sm font-bold">{otherUser.name?.[0]}</span>
                        )}
                      </span>
                    )}
                    <div className={cn("chat-bubble max-w-[78%]", (sending || failed) && "opacity-75")} data-own={isOwn}>
                      <p>{message.content}</p>
                      {failed ? (
                        <div className="mt-1.5 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm font-bold">
                          <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4" aria-hidden="true" /> Not sent</span>
                          <button
                            type="button"
                            className="min-h-[32px] underline underline-offset-2"
                            onClick={() => { setNewMessage(message.content); setMessages(prev => prev.filter(m => m.id !== message.id)); }}
                          >Try again</button>
                          <button
                            type="button"
                            className="min-h-[32px] underline underline-offset-2"
                            onClick={() => setMessages(prev => prev.filter(m => m.id !== message.id))}
                          >Delete</button>
                        </div>
                      ) : isOwn && endsRun ? (
                        <div className="chat-bubble-meta">
                          <span>{sending ? "Sending" : message.read ? "Read" : "Sent"}</span>
                          {message.read ? <CheckCheck aria-hidden="true" /> : <Check aria-hidden="true" />}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Game Cards */}
            {chatGames.map((game) => (
              <div key={game.id} className={cn("my-4", !prefersReducedMotion && "animate-fade-in")}>
                <ChatGameCard
                  game={game}
                  currentUserId={currentUser?.id || ""}
                  otherUserName={otherUser?.name || ""}
                  matchId={matchId || ""}
                />
              </div>
            ))}

            {/* Typing indicator */}
            <div aria-live="polite" aria-atomic="true">
              {isTyping && <span className="sr-only">{otherUser.name} is typing</span>}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    {otherUser.profile_image ? (
                      <img src={otherUser.profile_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-sm font-bold">{otherUser.name?.[0]}</span>
                    )}
                  </span>
                  <div className="chat-bubble" data-own="false" aria-hidden="true">
                    <div className="flex gap-1.5 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 motion-safe:animate-typing-wave" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 motion-safe:animate-typing-wave" style={{ animationDelay: "0.2s" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 motion-safe:animate-typing-wave" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* New message announcements for screen readers */}
            <div aria-live="polite" className="sr-only">
              {messages.length > 0 && messages[messages.length - 1].sender_id !== currentUser?.id &&
                `New message from ${otherUser.name}: ${messages[messages.length - 1].content}`
              }
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Composer: a game, the message, send. Nothing here that does not work. */}
      <div className="chat-composer">
        <form
          className="mx-auto flex w-full max-w-4xl items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        >
          <GameMenu
            matchId={matchId || ""}
            currentUserId={currentUser?.id || ""}
            otherUserId={otherUser?.id || ""}
          />
          <div className="min-w-0 flex-1">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder={`Message ${otherUser.name}`}
              aria-label={`Message ${otherUser.name}`}
              className="chat-input"
              maxLength={1000}
              enterKeyHint="send"
              autoComplete="off"
            />
            {newMessage.length > 800 && (
              <div className="mt-1 px-3 text-right text-xs text-muted-foreground tabular-nums">{newMessage.length}/1000</div>
            )}
          </div>
          <button type="submit" className="kit-action chat-send" aria-label="Send message" disabled={!newMessage.trim()}>
            <Send aria-hidden="true" />
          </button>
        </form>
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

      {/* Block confirmation dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {otherUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to see your profile or contact you. You can unblock them anytime in Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Connection</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setShowBlockDialog(false); handleBlock(); }}
            >
              Block {otherUser?.name}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unmatch confirmation dialog */}
      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove your connection with {otherUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the connection and deletes the conversation for both of you. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Connection</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setShowUnmatchDialog(false); handleUnmatch(); }}
            >
              Remove connection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Safety Tips bottom sheet */}
      <Sheet open={showSafetyTips} onOpenChange={setShowSafetyTips}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Safety Tips
            </SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <p>Never share financial information.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <p>Meet in a public place the first time.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <p>Tell a friend where you're going.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <p>Trust your instincts — if something feels off, it probably is.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <p>Report anyone who makes you uncomfortable.</p>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => { setShowSafetyTips(false); navigate("/community-guidelines"); }}
            >
              Read our full Safety Policy
            </Button>
          </div>
        </SheetContent>
      </Sheet>
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
