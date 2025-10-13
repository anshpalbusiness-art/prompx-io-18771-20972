import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PlanLimits {
  prompts_per_month: number;
  workflows: number;
  api_calls: number;
  team_members: number;
}

interface PlanFeatures {
  basic_templates?: boolean;
  all_templates?: boolean;
  advanced_workflows?: boolean;
  compliance_checks?: boolean;
  team_collaboration?: boolean;
  priority_support?: boolean;
  custom_templates?: boolean;
  dedicated_support?: boolean;
  prompt_optimization?: boolean;
  sso?: boolean;
  sla?: boolean;
  custom_integrations?: boolean;
}

interface PlanAccess {
  planType: string;
  planName: string;
  limits: PlanLimits;
  features: PlanFeatures;
  isLoading: boolean;
  canAccessFeature: (feature: keyof PlanFeatures) => boolean;
  canAccessWorkflows: () => boolean;
  canAccessAgents: () => boolean;
  hasProPlan: () => boolean;
  redirectToPricing: () => void;
  showUpgradeMessage: (featureName: string) => void;
}

export const usePlanAccess = (userId: string | undefined): PlanAccess => {
  const [planType, setPlanType] = useState<string>('free');
  const [planName, setPlanName] = useState<string>('Free');
  const [limits, setLimits] = useState<PlanLimits>({
    prompts_per_month: 5,
    workflows: 0,
    api_calls: 0,
    team_members: 1,
  });
  const [features, setFeatures] = useState<PlanFeatures>({
    basic_templates: true,
    prompt_optimization: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadUserPlan();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const loadUserPlan = async () => {
    try {
      setIsLoading(true);
      
      // Get user's active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;

      // Get plan details
      let planQuery = supabase
        .from('subscription_plans')
        .select('plan_type, plan_name, limits, features')
        .eq('is_active', true);

      if (subscription?.plan_id) {
        planQuery = planQuery.eq('id', subscription.plan_id);
      } else {
        // Default to free plan
        planQuery = planQuery.eq('plan_type', 'free');
      }

      const { data: plan, error: planError } = await planQuery.maybeSingle();

      if (planError) throw planError;

      if (plan) {
        setPlanType(plan.plan_type);
        setPlanName(plan.plan_name);
        setLimits(plan.limits);
        setFeatures(plan.features);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccessFeature = (feature: keyof PlanFeatures): boolean => {
    return features[feature] === true;
  };

  const canAccessWorkflows = (): boolean => {
    return limits.workflows !== 0;
  };

  const canAccessAgents = (): boolean => {
    // Free plan can create agents but with limited features
    // Pro and above have full access
    return planType !== 'free' || limits.prompts_per_month > 0;
  };

  const hasProPlan = (): boolean => {
    return planType !== 'free';
  };

  const redirectToPricing = () => {
    navigate('/settings?tab=pricing');
  };

  const showUpgradeMessage = (featureName: string) => {
    toast({
      title: "Upgrade Required",
      description: `${featureName} is only available on paid plans. Click to view pricing.`,
      variant: "destructive",
    });
  };

  return {
    planType,
    planName,
    limits,
    features,
    isLoading,
    canAccessFeature,
    canAccessWorkflows,
    canAccessAgents,
    hasProPlan,
    redirectToPricing,
    showUpgradeMessage,
  };
};
