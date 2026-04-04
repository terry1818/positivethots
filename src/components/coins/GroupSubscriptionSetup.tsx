import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Star, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface GroupSubscriptionSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: GroupSub[];
  defaultMemberCount: number;
}

const planIcons = { basic: Zap, premium: Crown, vip: Star };
const memberLabels: Record<number, string> = { 2: "Duo", 3: "Triad", 4: "Quad", 5: "Quint" };

export const GroupSubscriptionSetup = ({
  open,
  onOpenChange,
  plans,
  defaultMemberCount,
}: GroupSubscriptionSetupProps) => {
  const [planType, setPlanType] = useState<string>("premium");
  const [memberCount, setMemberCount] = useState(defaultMemberCount);

  const selectedPlan = plans.find(
    (p) => p.plan_type === planType && p.member_count === memberCount
  );

  const perPerson = selectedPlan
    ? (selectedPlan.monthly_price_usd / selectedPlan.member_count).toFixed(2)
    : "0";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Set Up a Group Plan
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Plan Type */}
          <div>
            <p className="text-sm font-medium mb-2">Select Plan</p>
            <Tabs value={planType} onValueChange={setPlanType}>
              <TabsList className="w-full">
                {(["basic", "premium", "vip"] as const).map((t) => {
                  const Icon = planIcons[t];
                  return (
                    <TabsTrigger key={t} value={t} className="flex-1 gap-1">
                      <Icon className="h-4 w-4" />
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Member Count */}
          <div>
            <p className="text-sm font-medium mb-2">Group Size</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant={memberCount === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMemberCount(n)}
                  className="flex-1"
                >
                  {memberLabels[n]}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          {selectedPlan && (
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{selectedPlan.name}</span>
                  <Badge className="bg-green-500/20 text-green-400">
                    Save {selectedPlan.savings_percentage}%
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Individual total</span>
                    <span className="line-through text-muted-foreground">
                      ${selectedPlan.individual_monthly_total.toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Group price</span>
                    <span className="text-primary">${selectedPlan.monthly_price_usd.toFixed(2)}/mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Per person</span>
                    <span>${perPerson}/mo</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    toast.info("Group subscriptions launching soon! We'll notify you.");
                    onOpenChange(false);
                  }}
                >
                  Send Invites to Partners
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
