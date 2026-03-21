import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShimmerButton } from "@/components/ShimmerButton";
import { StaggerChildren } from "@/components/StaggerChildren";
import { Crown, Heart, Eye, Zap, ArrowLeft, Loader2 } from "lucide-react";

const benefits = [
  { icon: Eye, title: "See Who Likes You", desc: "Instantly reveal everyone who's interested" },
  { icon: Heart, title: "Connect Directly", desc: "Match with people who already like you" },
  { icon: Zap, title: "Priority Visibility", desc: "Get seen by more people in Discover" },
];

const Premium = () => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-blob-float" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl animate-blob-float [animation-delay:5s]" />
        <div className="animate-bounce-in relative z-10">
          <Crown className="h-16 w-16 text-primary mb-4 mx-auto animate-pulse-glow" />
          <h1 className="text-2xl font-bold mb-2 text-center">You're Premium!</h1>
          <p className="text-muted-foreground mb-6 text-center">You have full access to all premium features.</p>
          <Button onClick={() => navigate("/likes")}>View Your Likes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-blob-float" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl animate-blob-float [animation-delay:5s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/8 blur-3xl animate-blob-float [animation-delay:10s]" />

      <div className="container max-w-md mx-auto px-4 py-6 relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Crown className="h-8 w-8 text-primary animate-wiggle" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Go Premium</h1>
          <p className="text-muted-foreground">Unlock the full experience</p>
        </div>

        <StaggerChildren className="space-y-3 mb-8" stagger={100}>
          {benefits.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:shadow-md transition-all hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </StaggerChildren>

        <Card className="animate-pulse-border border-primary">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Monthly</p>
            <p className="text-4xl font-bold mb-1">$9.99</p>
            <p className="text-sm text-muted-foreground mb-4">per month • cancel anytime</p>
            <ShimmerButton
              className="w-full text-lg h-12 bg-gradient-to-r from-primary to-secondary"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Subscribe Now"}
            </ShimmerButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Premium;
