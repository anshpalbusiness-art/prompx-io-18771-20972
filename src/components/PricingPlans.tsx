import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface Plan {
  id: string;
  plan_name: string;
  plan_type: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  limits: any;
}

interface PricingPlansProps {
  user: User | null;
}

export default function PricingPlans({ user }: PricingPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
    if (user) {
      loadCurrentSubscription();
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading plans",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(plan_name)")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setCurrentPlan((data.subscription_plans as any).plan_name);
      }
    } catch (error: any) {
      console.error("Error loading subscription:", error);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to select a plan",
        variant: "destructive",
      });
      return;
    }

    if (plan.plan_type === "free") {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan!",
      });
      return;
    }

    toast({
      title: "Upgrade Coming Soon",
      description: "Stripe integration will be available soon for paid plans",
    });
  };

  const getFeaturesList = (features: any, limits: any) => {
    const featureList = [];
    
    if (limits.prompts_per_month === -1) {
      featureList.push("Unlimited prompts per month");
    } else {
      featureList.push(`${limits.prompts_per_month} prompts per month`);
    }
    
    if (limits.workflows === -1) {
      featureList.push("Unlimited workflows");
    } else if (limits.workflows > 0) {
      featureList.push(`${limits.workflows} workflows`);
    }
    
    if (limits.team_members > 1) {
      featureList.push(`Up to ${limits.team_members} team members`);
    }
    
    if (limits.api_calls > 0) {
      if (limits.api_calls === -1) {
        featureList.push("Unlimited API calls");
      } else {
        featureList.push(`${limits.api_calls} API calls per month`);
      }
    }
    
    if (features.compliance_checks) featureList.push("Compliance checks");
    if (features.team_collaboration) featureList.push("Team collaboration");
    if (features.priority_support) featureList.push("Priority support");
    if (features.dedicated_support) featureList.push("Dedicated support");
    if (features.custom_templates) featureList.push("Custom templates");
    if (features.sso) featureList.push("SSO authentication");
    if (features.sla) featureList.push("SLA guarantee");
    
    return featureList;
  };

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your needs
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant={billingCycle === "monthly" ? "default" : "outline"}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "yearly" ? "default" : "outline"}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 17%</Badge>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              currentPlan === plan.plan_name ? "border-primary shadow-lg" : ""
            }`}
          >
            {currentPlan === plan.plan_name && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Current Plan
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">
                  ${billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {getFeaturesList(plan.features, plan.limits).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={currentPlan === plan.plan_name ? "outline" : "default"}
                disabled={currentPlan === plan.plan_name}
                onClick={() => handleSelectPlan(plan)}
              >
                {currentPlan === plan.plan_name
                  ? "Current Plan"
                  : plan.plan_type === "free"
                  ? "Get Started"
                  : "Upgrade"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}