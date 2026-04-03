import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";

interface PageSkeletonProps {
  variant?: "profile" | "chat" | "learn" | "list" | "discovery" | "messages" | "likes" | "default";
}

const SkeletonHeader = ({ children }: { children?: React.ReactNode }) => (
  <header className="border-b border-border bg-card">
    <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
      {children || <Logo size="md" showText={false} />}
    </div>
  </header>
);

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading profile">
    <SkeletonHeader>
      <Logo size="md" showText={false} />
      <Skeleton className="h-8 w-8 rounded-md" />
    </SkeletonHeader>
    <div className="container max-w-md mx-auto px-4 py-6 space-y-4">
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="space-y-2 px-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="flex gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 flex-1 rounded-xl" />)}
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  </div>
);

const ChatSkeleton = () => (
  <div className="min-h-screen bg-background flex flex-col" aria-busy="true" aria-label="Loading chat">
    <div className="border-b px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <div className="flex-1 px-4 py-6 space-y-4">
      <div className="flex justify-start"><Skeleton className="h-10 w-48 rounded-2xl rounded-bl-md" /></div>
      <div className="flex justify-end"><Skeleton className="h-10 w-56 rounded-2xl rounded-br-md" /></div>
      <div className="flex justify-start"><Skeleton className="h-14 w-64 rounded-2xl rounded-bl-md" /></div>
      <div className="flex justify-end"><Skeleton className="h-10 w-40 rounded-2xl rounded-br-md" /></div>
      <div className="flex justify-start"><Skeleton className="h-10 w-52 rounded-2xl rounded-bl-md" /></div>
    </div>
    <div className="border-t px-4 py-4">
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  </div>
);

const LearnSkeleton = () => (
  <div className="min-h-screen bg-background pb-20" aria-busy="true" aria-label="Loading learn">
    <SkeletonHeader>
      <Logo size="md" showText={false} />
      <Skeleton className="h-6 w-32" />
    </SkeletonHeader>
    <div className="container max-w-md mx-auto px-4 py-6 space-y-4">
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex gap-3">
        <Skeleton className="h-16 flex-1 rounded-xl" />
        <Skeleton className="h-16 flex-1 rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-16 w-16 rounded-full mx-auto" />
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
        </div>
      ))}
    </div>
    <BottomNav />
  </div>
);

const DiscoverySkeleton = () => (
  <div className="min-h-screen bg-background pb-20" aria-busy="true" aria-label="Loading discovery">
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <Logo size="md" showText={false} />
      </div>
    </div>
    <div className="max-w-sm mx-auto px-4 pt-4">
      <div className="rounded-3xl overflow-hidden border border-border">
        <Skeleton className="w-full rounded-none" style={{ aspectRatio: "3/4" }} />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-center gap-4 pt-2">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
);

const MessagesSkeleton = () => (
  <div className="min-h-screen bg-background pb-20" aria-busy="true" aria-label="Loading messages">
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Logo size="md" showText={false} />
        <div className="w-10" />
      </div>
    </header>
    <div className="container max-w-md mx-auto px-4 py-6 space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
        </div>
      ))}
    </div>
    <BottomNav />
  </div>
);

const LikesSkeleton = () => (
  <div className="min-h-screen bg-background pb-20" aria-busy="true" aria-label="Loading likes">
    <div className="container max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl overflow-hidden border border-border">
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="flex">
              <Skeleton className="h-10 flex-1 rounded-none" />
              <Skeleton className="h-10 flex-1 rounded-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <BottomNav />
  </div>
);

const ListSkeleton = () => (
  <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading content">
    <SkeletonHeader>
      <Skeleton className="h-8 w-8 rounded-md" />
      <Logo size="md" showText={false} />
      <div className="w-8" />
    </SkeletonHeader>
    <div className="container max-w-md mx-auto px-4 py-6 space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  </div>
);

const DefaultSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center" aria-busy="true" aria-label="Loading">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-pulse"><Logo size="lg" /></div>
      <div className="flex gap-1.5">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
      </div>
    </div>
  </div>
);

const skeletonMap: Record<string, React.FC> = {
  profile: ProfileSkeleton,
  chat: ChatSkeleton,
  learn: LearnSkeleton,
  discovery: DiscoverySkeleton,
  messages: MessagesSkeleton,
  likes: LikesSkeleton,
  list: ListSkeleton,
  default: DefaultSkeleton,
};

export const PageSkeleton = ({ variant = "default" }: PageSkeletonProps) => {
  const Component = skeletonMap[variant] || DefaultSkeleton;
  return <Component />;
};
