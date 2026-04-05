import { useState, useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const COMMUNITY_SLOGANS = [
  "You found your people. Keep thinking Positive Thots.",
  "A community built on openness. Think Positive Thots.",
  "Safe. Real. Open. Think Positive Thots.",
];

export const WelcomeBackBanner = () => {
  const prefersReducedMotion = useReducedMotion();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Only show ~30% of the time, max once per session
    const shown = sessionStorage.getItem("pt_welcome_banner_shown");
    if (shown) return;
    if (Math.random() > 0.3) return;

    // Pick a random slogan
    const slogan = COMMUNITY_SLOGANS[Math.floor(Math.random() * COMMUNITY_SLOGANS.length)];
    setMessage(slogan);
    setShow(true);
    sessionStorage.setItem("pt_welcome_banner_shown", "1");

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show || !message) return null;

  // Add TM after "Thots"
  const renderMsg = () => {
    const parts = message.split(/(Thots\.?)/);
    return parts.map((part, i) => {
      if (/^Thots\.?$/.test(part)) {
        return (
          <span key={i}>
            {part}
            <sup className="opacity-70" style={{ fontSize: "60%", verticalAlign: "super" }}>TM</sup>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        "w-full text-center py-3 px-4 text-primary text-[13px] bg-primary/10",
        prefersReducedMotion ? "" : "animate-fade-in"
      )}
      style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: 44 }}
      role="status"
    >
      {renderMsg()}
    </div>
  );
};
