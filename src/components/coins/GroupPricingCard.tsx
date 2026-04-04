import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { GroupSubscriptionSetup } from "./GroupSubscriptionSetup";

interface GroupSub {
  id: string;
  name: string;
  member_count: number;
  plan_type: string;
  monthly_price_usd: number;
  annual_price_usd: number;
  individual_monthly_total: number;
  savings_percentage: number;
}

interface GroupPricingCardProps {
  partnerCount: number;
}

export const GroupPricingCard = ({ partnerCount }: GroupPricingCardProps) => {
  const [showSetup, setShowSetup] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["group-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_subscriptions")
        .select("*")
        .eq("is_active", true)
        .order("member_count")
        .order("plan_type");
      if (error) throw error;
      return data as GroupSub[];
    },
  });

  if (partnerCount < 1) return null;

  const memberCount = Math.min(partnerCount + 1, 5);
  const bestPlan = plans.find(
    (p) => p.member_count === memberCount && p.plan_type === "premium"
  );

  if (isLoading) return <Skeleton className="h-40" />;
  if (!bestPlan) return null;

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Polycule Plan</CardTitle>
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              Save {bestPlan.savings_percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground line-through">
                Individual: ${bestPlan.individual_monthly_total.toFixed(2)}/mo
              </p>
              <p className="text-lg font-bold">
                {bestPlan.name}: <span className="text-primary">${bestPlan.monthly_price_usd.toFixed(2)}/mo</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            One payment covers {memberCount} people. Everyone gets full {bestPlan.plan_type} features.
          </p>
          <Button onClick={() => setShowSetup(true)} className="w-full" size="sm">
            Set Up Group Plan <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <GroupSubscriptionSetup
        open={showSetup}
        onOpenChange={setShowSetup}
        plans={plans}
        defaultMemberCount={memberCount}
      />
    </>
  );
};
