import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Zap, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface UsageInfo {
  limit: number;
  used: number;
  remaining: number;
  has_access: boolean;
}

interface UsageDashboardProps {
  user: User | null;
}

export default function UsageDashboard({ user }: UsageDashboardProps) {
  const [promptUsage, setPromptUsage] = useState<UsageInfo | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user]);

  const loadUsageData = async () => {
    try {
      // Load current subscription
      const { data: subscription, error: subError } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .maybeSingle();

      if (subError && subError.code !== "PGRST116") throw subError;

      if (subscription) {
        setCurrentPlan(subscription.subscription_plans);
      } else {
        // Load free plan as default
        const { data: freePlan, error: planError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("plan_type", "free")
          .single();

        if (planError) throw planError;
        setCurrentPlan(freePlan);
      }

      // Load usage through database function
      const { data: usageData, error: usageError } = await supabase.rpc(
        "check_usage_limit",
        {
          _user_id: user?.id,
          _resource_type: "prompt_optimization",
          _period_days: 30,
        }
      );

      if (usageError) throw usageError;
      setPromptUsage(usageData as any as UsageInfo);
    } catch (error: any) {
      console.error("Error loading usage:", error);
      toast({
        title: "Error loading usage data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (used: number, limit: number) => {
    if (limit === -1) return "text-primary";
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-warning";
    return "text-primary";
  };

  if (loading) {
    return <div className="text-center py-8">Loading usage data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlan?.plan_name || "Free"}</div>
            <p className="text-xs text-muted-foreground">
              ${currentPlan?.price_monthly || 0}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompts Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUsageColor(promptUsage?.used || 0, promptUsage?.limit || 0)}`}>
              {promptUsage?.used || 0}
              {promptUsage?.limit !== -1 && ` / ${promptUsage?.limit}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {promptUsage?.limit === -1 ? "Unlimited" : `${promptUsage?.remaining || 0} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPlan?.limits?.workflows === -1
                ? "Unlimited"
                : currentPlan?.limits?.workflows || 0}
            </div>
            <p className="text-xs text-muted-foreground">Available workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPlan?.limits?.api_calls === -1
                ? "Unlimited"
                : currentPlan?.limits?.api_calls === 0
                ? "Not Available"
                : `${currentPlan?.limits?.api_calls || 0}/mo`}
            </div>
            <p className="text-xs text-muted-foreground">Monthly API limit</p>
          </CardContent>
        </Card>
      </div>

      {promptUsage && promptUsage.limit !== -1 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Your prompt optimization usage for the current billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Prompt Optimizations</span>
                <span className="text-sm text-muted-foreground">
                  {promptUsage.used} / {promptUsage.limit}
                </span>
              </div>
              <Progress value={calculatePercentage(promptUsage.used, promptUsage.limit)} />
              {promptUsage.remaining <= 5 && promptUsage.remaining > 0 && (
                <p className="text-sm text-warning">
                  You're running low on prompts. Consider upgrading your plan.
                </p>
              )}
              {promptUsage.remaining === 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Limit Reached</Badge>
                  <p className="text-sm text-destructive">
                    Upgrade your plan to continue optimizing prompts
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>Your current plan includes these features</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentPlan?.features?.prompt_optimization && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Prompt Optimization</span>
              </li>
            )}
            {currentPlan?.features?.advanced_workflows && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Advanced Workflows</span>
              </li>
            )}
            {currentPlan?.features?.compliance_checks && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Compliance Checks</span>
              </li>
            )}
            {currentPlan?.features?.team_collaboration && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Team Collaboration</span>
              </li>
            )}
            {currentPlan?.features?.priority_support && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Priority Support</span>
              </li>
            )}
            {currentPlan?.features?.dedicated_support && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Dedicated Support</span>
              </li>
            )}
            {currentPlan?.features?.custom_templates && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">Custom Templates</span>
              </li>
            )}
            {currentPlan?.features?.sso && (
              <li className="flex items-center gap-2">
                <Badge variant="outline">✓</Badge>
                <span className="text-sm">SSO Authentication</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}