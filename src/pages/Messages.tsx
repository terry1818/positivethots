import { useEffect, useState, useMemo, useCallback, type CSSProperties } from "react";
import { useTutorialState } from "@/hooks/useTutorialState";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { BlurImage } from "@/components/BlurImage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { BookOpen, Calendar, BookMarked, Share2, ChevronRight, Lightbulb } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { shareApp } from "@/lib/shareApp";
import { VerifiedBadgeOverlay } from "@/components/VerifiedBadgeOverlay";
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SEO } from "@/components/SEO";

interface Match {
  id: string;
  profile: {
    id: string;
    name: string;
    profile_image: string | null;
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

/** A member's photo in their frame, with a verified or active-now mark. */
const Avatar = ({ match, size, eager }: { match: Match; size: "md" | "lg"; eager?: boolean }) => (
  <span className="relative block shrink-0">
    <ProfileFrame frameId={match.profile.selected_frame} size={size}>
      {match.profile.profile_image ? (
        <BlurImage
          src={match.profile.profile_image}
          alt=""
          className="h-full w-full"
          aspectRatio="1/1"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          sizes="64px"
        />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full bg-muted text-lg font-extrabold text-muted-foreground">{match.profile.name?.[0] || "?"}</span>
      )}
    </ProfileFrame>
    {match.profile.is_verified ? (
      <VerifiedBadgeOverlay isVerified size="sm" />
    ) : isRecentlyActive(match.profile.last_active_at) ? (
      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-success" aria-label="Active now" />
    ) : null}
  </span>
);

const Messages = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const { seen: messagesTourSeen, markSeen: markMessagesTourSeen } = useTutorialState("messages_tour");
  const [showMessagesTour, setShowMessagesTour] = useState(false);

  const messagesTourSteps: TourStep[] = [
    { target: "messages-first-conversation", title: "Your conversations", description: "When you and someone both say yes, you'll see them here. Tap to start chatting!", position: "below" },
    { target: "messages-preview", title: "Quick preview", description: "See the last message at a glance. Unread conversations are marked and come first.", position: "below" },
  ];
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessage>>({});
  const [loading, setLoading] = useState(true);
  // The list failed to load (as opposed to loading fine and being empty).
  const [loadError, setLoadError] = useState(false);
  // When the member last opened each conversation, to mark the ones with something new.
  const [lastRead, setLastRead] = useState<Record<string, string>>({});
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
      .channel(`matches-realtime-${userId}`)
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

      const [matchesResult, blockedResult, receiptsResult] = await Promise.all([
        supabase
          .from("matches")
          .select("id, user1_id, user2_id, created_at")
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("blocked_users")
          .select("blocked_id, blocker_id")
          .or(`blocker_id.eq.${session.user.id},blocked_id.eq.${session.user.id}`),
        supabase
          .from("message_read_receipts" as any)
          .select("match_id, last_read_at")
          .eq("user_id", session.user.id),
      ]);

      if (matchesResult.error) throw matchesResult.error;
      const readMap: Record<string, string> = {};
      for (const row of ((receiptsResult.data as any[]) || [])) readMap[row.match_id] = row.last_read_at;
      setLastRead(readMap);

      const blockedUserIds = new Set<string>();
      blockedResult.data?.forEach(row => {
        if (row.blocker_id === session.user.id) blockedUserIds.add(row.blocked_id);
        else blockedUserIds.add(row.blocker_id);
      });

      const filteredMatches = matchesResult.data.filter(match => {
        const otherId = match.user1_id === session.user.id ? match.user2_id : match.user1_id;
        return !blockedUserIds.has(otherId);
      });

      // Fetch profiles and last messages in parallel (resilient — one failure doesn't block others)
      const profileResults = await Promise.allSettled(
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
              // No profile came back: show an initial, never a picture fetched from another service.
              id: otherId, name: "Member", profile_image: null, age: 0,
            },
          };
        })
      );
      const matchesWithProfiles = profileResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map(r => r.value)
        .filter(Boolean);

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
      setLoadError(false);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Something new: the last message is theirs and arrived after the member last opened the conversation.
  const isUnread = useCallback((matchId: string) => {
    const last = lastMessages[matchId];
    if (!last || last.sender_id === userId) return false;
    const read = lastRead[matchId];
    return !read || new Date(last.created_at).getTime() > new Date(read).getTime();
  }, [lastMessages, lastRead, userId]);

  const visible = useMemo(
    () => (searchQuery ? matches.filter(m => m.profile.name.toLowerCase().includes(searchQuery)) : matches),
    [matches, searchQuery],
  );
  // People who said yes and have not been written to yet.
  const newConnections = useMemo(() => visible.filter(m => !lastMessages[m.id]), [visible, lastMessages]);
  // Conversations: unread first, then most recent.
  const conversations = useMemo(() => visible
    .filter(m => lastMessages[m.id])
    .sort((a, b) => {
      const unread = Number(isUnread(b.id)) - Number(isUnread(a.id));
      if (unread !== 0) return unread;
      return new Date(lastMessages[b.id].created_at).getTime() - new Date(lastMessages[a.id].created_at).getTime();
    }), [visible, lastMessages, isUnread]);
  const unreadCount = conversations.filter(m => isUnread(m.id)).length;

  return (
    <div className="kit-area-chat min-h-screen bg-background flex flex-col">
      <SEO
        title="Chat — Positive Thots"
        description="Your conversations on Positive Thots. Chat with intention and connect with care."
        path="/messages"
      />
      <header className="kit-header sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-1 md:max-w-2xl lg:max-w-4xl">
          <Logo size="md" showText={false} />
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="text-xl font-extrabold">Chat</h1>
            {unreadCount > 0 && (
              <span className="kit-chip" data-tone="area" aria-label={`${unreadCount} unread ${unreadCount === 1 ? "conversation" : "conversations"}`}>{unreadCount}</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 pt-4 md:max-w-2xl lg:max-w-4xl">
        {loading ? (
          <div className="space-y-2.5" aria-busy="true" aria-label="Loading conversations">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-border p-3">
                <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <BrandedEmptyState
            mascot="confused"
            headline="We couldn't load your conversations."
            description="Check your connection and try again."
            ctaLabel="Try again"
            onCtaClick={() => { setLoading(true); loadMatches(); }}
            className="py-4"
          />
        ) : matches.length === 0 ? (
          <div className="space-y-5">
            <BrandedEmptyState
              mascot="chat"
              headline="No conversations yet"
              description="When you and someone both Connect, you can start chatting here."
              ctaLabel="Go to Discover"
              onCtaClick={() => navigate("/")}
              className="py-3"
            />

            <div>
              <h2 className="kit-eyebrow px-1">While you wait</h2>
              <div className="mt-2 grid gap-2.5">
                {[
                  { icon: BookOpen, tone: "area", area: "kit-area-learn", title: "Keep learning", text: "Earn badges to stand out.", go: () => navigate("/learn") },
                  { icon: Calendar, tone: "info", area: "", title: "Browse events", text: "Meet the community in person or online.", go: () => navigate("/events") },
                  { icon: BookMarked, tone: "highlight", area: "", title: "Resources", text: "Books, journals and more.", go: () => navigate("/resources") },
                  { icon: Share2, tone: "pink", area: "", title: "Invite friends", text: "Share your link and grow the community.", go: () => { void shareApp(); } },
                ].map((row, i) => (
                  <button key={row.title} type="button" className={`kit-row kit-rise ${row.area}`} style={{ "--i": i } as CSSProperties} onClick={row.go}>
                    <span className="kit-coin" data-tone={row.tone}><row.icon aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-tight">{row.title}</span>
                      <span className="block text-sm text-muted-foreground">{row.text}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="kit-card flex items-start gap-3 p-4">
              <span className="kit-coin" data-tone="reward"><Lightbulb aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold leading-tight">A good first message</h2>
                <p className="text-sm text-muted-foreground [text-wrap:pretty]">Ask what they're learning right now, or which badge they're proudest of.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SearchInput placeholder="Search conversations..." ariaLabel="Search conversations" onSearch={handleSearch} />

            {visible.length === 0 && searchQuery ? (
              <BrandedEmptyState mascot="confused" headline="No one by that name" description="Try another name." className="py-3" />
            ) : null}

            {/* People who said yes and are waiting for a first message. */}
            {newConnections.length > 0 && (
              <section aria-labelledby="new-connections">
                <h2 id="new-connections" className="kit-eyebrow px-1">Say hi</h2>
                <ul className="-mx-4 mt-2 flex gap-3 overflow-x-auto px-4 pb-2">
                  {newConnections.map((match, idx) => (
                    <li key={match.id} className="shrink-0">
                      <button
                        type="button"
                        className="flex w-[84px] flex-col items-center gap-1.5 rounded-2xl py-1 text-center"
                        onClick={() => navigate(`/chat/${match.id}`)}
                        aria-label={`Say hi to ${match.profile.name}`}
                        data-tour={conversations.length === 0 && idx === 0 ? "messages-first-conversation" : undefined}
                      >
                        <Avatar match={match} size="md" eager={idx < 4} />
                        <span className="w-full truncate text-sm font-bold">{match.profile.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {conversations.length > 0 && (
              <section aria-labelledby="conversations">
                <h2 id="conversations" className="kit-eyebrow px-1">Conversations</h2>
                <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2.5">
                  {conversations.map((match, idx) => {
                    const lastMsg = lastMessages[match.id];
                    const unread = isUnread(match.id);
                    return (
                      <li key={match.id} className="min-w-0">
                        <button
                          type="button"
                          className={`kit-row kit-rise ${unread ? "kit-row-next" : ""}`}
                          style={{ "--i": Math.min(idx, 8) } as CSSProperties}
                          data-tour={idx === 0 ? "messages-first-conversation" : undefined}
                          onClick={() => navigate(`/chat/${match.id}`)}
                        >
                          <Avatar match={match} size="md" eager={idx === 0} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate font-bold">{match.profile.name}{match.profile.age ? `, ${match.profile.age}` : ""}</span>
                              <span className="shrink-0 text-sm text-muted-foreground">{formatRelativeTime(lastMsg.created_at)}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-bold text-foreground" : "text-muted-foreground"}`} data-tour={idx === 0 ? "messages-preview" : undefined}>
                                {lastMsg.sender_id === userId && <span className="opacity-70">You: </span>}
                                {lastMsg.content}
                              </span>
                              {unread && <span className="kit-chip shrink-0" data-tone="area">New</span>}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
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
