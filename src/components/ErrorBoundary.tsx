import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/errorReporting";
import mascotConfused from "@/assets/mascot-confused.png";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    reportError(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center text-center px-8 py-12 animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
              <img
                src={mascotConfused}
                alt=""
                className="relative w-[120px] h-[120px] object-contain drop-shadow-lg"
                loading="lazy"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 max-w-xs">
              Oops! Something went wrong 😅
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-sm leading-relaxed">
              Check your connection and try again.
            </p>
            <Button onClick={() => window.location.reload()} className="rounded-full">
              Retry
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
