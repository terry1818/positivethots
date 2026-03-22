import { Logo } from "@/components/Logo";

export const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="animate-pulse">
      <Logo size="lg" />
    </div>
    <div className="flex gap-1.5">
      <div className="w-2 h-2 rounded-full bg-primary animate-typing-wave" />
      <div className="w-2 h-2 rounded-full bg-primary animate-typing-wave" style={{ animationDelay: "0.2s" }} />
      <div className="w-2 h-2 rounded-full bg-primary animate-typing-wave" style={{ animationDelay: "0.4s" }} />
    </div>
  </div>
);
