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
        mascot="binoculars"
        headline="We looked everywhere"
        description="This page isn't here. Let's get you back on track."
        ctaLabel="Go Home"
        onCtaClick={() => navigate("/")}
      />
    </div>
  );
};

export default NotFound;
