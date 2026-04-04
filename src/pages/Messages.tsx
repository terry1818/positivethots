import { useEffect, useState, useMemo, useCallback } from "react";
import { useTutorialState } from "@/hooks/useTutorialState";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { BlurImage } from "@/components/BlurImage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, ChevronLeft, BookOpen, Calendar, BookMarked, Share2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { SearchInput } from "@/components/SearchInput";

interface Match {
  id: string;
  profile: {
    id: string;
    name: string;
    profile_image: string;
    age: number;
    is_verified?: boolean;
    selected_frame?: string;
    last_active_at?: string | null;
  };
}

interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isRecentlyActive(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000; // 5 minutes
}

const Messages = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const { seen: messagesTourSeen, markSeen: markMessagesTourSeen } = useTutorialState("messages_tour");
  const [showMessagesTour, setShowMessagesTour] = useState(false);

  const messagesTourSteps: TourStep[] = [
    { target: "messages-first-conversation", title: "Your Matches", description: "When you and someone both say yes, you'll see them here. Tap to start chatting!", position: "below" },
    { target: "messages-preview", title: "Quick Preview", description: "See your last message at a glance. Unread conversations appear at the top.", position: "below" },
  ];
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessage>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const handleSearch = useCallback((q: string) => setSearchQuery(q.toLowerCase()), []);

  useEffect(() => {
    checkAuth();
    loadMatches();
  }, []);

  // Realtime subscription for new matches
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('matches-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user1_id=eq.${userId}` }, () => loadMatches())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user2_id=eq.${userId}` }, () => loadMatches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Show messages tour after loading if there are matches
  useEffect(() => {
    if (!loading && !messagesTourSeen && matches.length > 0) {
      setTimeout(() => setShowMessagesTour(true), 600);
    }
  }, [loading, messagesTourSeen, matches.length]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const loadMatches = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const [matchesResult, blockedResult] = await Promise.all([
        supabase
          .from("matches")
          .select("id, user1_id, user2_id, created_at")
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("blocked_users")
          .select("blocked_id, blocker_id")
          .or(`blocker_id.eq.${session.user.id},blocked_id.eq.${session.user.id}`),
      ]);

      if (matchesResult.error) throw matchesResult.error;

      const blockedUserIds = new Set<string>();
      blockedResult.data?.forEach(row => {
        if (row.blocker_id === session.user.id) blockedUserIds.add(row.blocked_id);
        else blockedUserIds.add(row.blocker_id);
      });

      const filteredMatches = matchesResult.data.filter(match => {
        const otherId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
        return !blockedUserIds.has(otherId);
      });

      // Fetch profiles and last messages in parallel
      const matchesWithProfiles = await Promise.all(
        filteredMatches.map(async (match) => {
          const otherId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
          const { data: profileData } = await supabase
            .rpc("get_public_profile", { _user_id: otherId });
          const profile = profileData?.[0];
          return {
            id: match.id,
            profile: profile ? {
              ...profile,
              last_active_at: (profile as any).last_active_at || null,
            } : {
              id: otherId, name: "Unknown",
              profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`, age: 0,
            },
          };
        })
      );

      // Fetch last messages for all matches
      const lastMsgs: Record<string, LastMessage> = {};
      await Promise.all(
        filteredMatches.map(async (match) => {
          const { data } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("match_id", match.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data) lastMsgs[match.id] = data;
        })
      );

      setLastMessages(lastMsgs);
      setMatches(matchesWithProfiles);
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  // Sort: conversations with messages first (by most recent message), then new matches
  const sortedMatches = useMemo(() => {
    let filtered = [...matches];
    if (searchQuery) {
      filtered = filtered.filter(m => m.profile.name.toLowerCase().includes(searchQuery));
    }
    return filtered.sort((a, b) => {
      const lastA = lastMessages[a.id];
      const lastB = lastMessages[b.id];
      if (lastA && lastB) return new Date(lastB.created_at).getTime() - new Date(lastA.created_at).getTime();
      if (lastA && !lastB) return -1;
      if (!lastA && lastB) return 1;
      return 0;
    });
  }, [matches, lastMessages, searchQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" showText={false} />
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : matches.length === 0 && !searchQuery ? (
          <div className="space-y-4">
            <BrandedEmptyState
              mascot="waving"
              headline="No messages yet! 💬"
              description="When you and someone both say yes, you can start chatting here."
              ctaLabel="Go to Discovery"
              onCtaClick={() => navigate("/")}
              className="py-6 [&_img]:max-h-[80px] [&_.mb-6]:mb-3"
            />

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground text-center">While you wait...</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("/learn")}
                  className="flex flex-col items-center gap-1.5 p-3 min-h-[72px] rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Continue Learning</span>
                  <span className="text-xs text-muted-foreground">Earn badges to stand out</span>
                </button>
                <button
                  onClick={() => navigate("/events")}
                  className="flex flex-col items-center gap-1.5 p-3 min-h-[72px] rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Browse Events</span>
                  <span className="text-xs text-muted-foreground">Meet people in person</span>
                </button>
                <button
                  onClick={() => navigate("/resources")}
                  className="flex flex-col items-center gap-1.5 p-3 min-h-[72px] rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <BookMarked className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Resources</span>
                  <span className="text-xs text-muted-foreground">Books, journals & more</span>
                </button>
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: "Join Positive Thots",
                      text: "Check out Positive Thots — a dating app that educates!",
                      url: "https://positivethots.app",
                    }).catch(() => {
                      navigator.clipboard.writeText("https://positivethots.app");
                      toast.success("Link copied!");
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 min-h-[72px] rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Share2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Invite Friends</span>
                  <span className="text-xs text-muted-foreground">Grow the community</span>
                </button>
              </div>
            </div>

            <Card className="p-3">
              <p className="text-sm font-medium mb-1">💡 Conversation Starters</p>
              <p className="text-xs text-muted-foreground">
                When you get your first match, try asking about their learning journey or what badges they're most proud of!
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            <SearchInput placeholder="Search conversations..." ariaLabel="Search conversations" onSearch={handleSearch} />
            {sortedMatches.length === 0 && searchQuery ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations matching &lsquo;{searchQuery}&rsquo;</p>
            ) : null}
            {sortedMatches.map((match, idx) => {
              const lastMsg = lastMessages[match.id];
              const showOnline = isRecentlyActive((match.profile as any).last_active_at);

              return (
                <Card
                  key={match.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:-translate-y-0.5 animate-stagger-fade min-h-[72px]"
                  style={{ animationDelay: `${idx * 60}ms` }}
                  data-tour={idx === 0 ? "messages-first-conversation" : undefined}
                  onClick={() => navigate(`/chat/${match.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <ProfileFrame frameId={(match.profile as any).selected_frame} size="md">
                        <BlurImage
                          src={match.profile.profile_image}
                          alt={match.profile.name}
                          className="h-full w-full"
                          aspectRatio="1/1"
                          loading={idx === 0 ? "eager" : "lazy"}
                          fetchPriority={idx === 0 ? "high" : undefined}
                          sizes="48px"
                        />
                      </ProfileFrame>
                      {match.profile.is_verified ? (
                        <VerifiedBadgeOverlay isVerified size="sm" />
                      ) : showOnline ? (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-card animate-pulse" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base truncate">{match.profile.name}, {match.profile.age}</h3>
                        {lastMsg && (
                          <span className="text-sm text-muted-foreground shrink-0 ml-2">
                            {formatRelativeTime(lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate" data-tour={idx === 0 ? "messages-preview" : undefined}>
                        {lastMsg ? (
                          <>
                            {lastMsg.sender_id === userId && <span className="opacity-60">You: </span>}
                            {lastMsg.content}
                          </>
                        ) : (
                          <span className="text-primary italic">Tap to say hi! 👋</span>
                        )}
                      </p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
      {showMessagesTour && (
        <SpotlightTour
          tourKey="messages_tour"
          steps={messagesTourSteps}
          onComplete={() => { setShowMessagesTour(false); markMessagesTourSeen(); }}
        />
      )}
    </div>
  );
};

export default Messages;
