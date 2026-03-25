import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";

interface PageSkeletonProps {
  variant?: "profile" | "chat" | "learn" | "list" | "default";
}

export const PageSkeleton = ({ variant = "default" }: PageSkeletonProps) => {
  if (variant === "profile") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" showText={false} />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </header>
        <div className="container max-w-md mx-auto px-4 py-6 space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-10 rounded-full" />)}
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (variant === "chat") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-4">
          <div className="flex justify-start"><Skeleton className="h-12 w-48 rounded-2xl" /></div>
          <div className="flex justify-end"><Skeleton className="h-12 w-56 rounded-2xl" /></div>
          <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
          <div className="flex justify-end"><Skeleton className="h-10 w-40 rounded-2xl" /></div>
          <div className="flex justify-start"><Skeleton className="h-12 w-52 rounded-2xl" /></div>
        </div>
        <div className="border-t px-4 py-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (variant === "learn") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <div className="container max-w-md mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Logo size="md" showText={false} />
            <div className="w-8" />
          </div>
        </header>
        <div className="container max-w-md mx-auto px-4 py-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse"><Logo size="lg" /></div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-typing-wave" />
          <div className="w-2 h-2 rounded-full bg-primary animate-typing-wave" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-typing-wave" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};
