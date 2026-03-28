import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <BrandedEmptyState
        mascot="shrug"
        headline="This page doesn't exist! 🤷"
        description="Looks like this Thot got lost."
        ctaLabel="Go Home"
        onCtaClick={() => navigate("/")}
      />
    </div>
  );
};

export default NotFound;
