export const PLAN_LEVELS: Record<string, number> = {
  free: 0,
  starter: 0,
  growth: 1,
  scale: 1,
  enterprise: 1,
};

// Any paid plan (1) unlocks everything. Free (0) has basic features only.
export const FEATURE_PLANS: Record<string, number> = {
  widget_embed: 0,
  basic_analytics: 0,
  email_support: 0,
  basic_ai_training: 0,

  advanced_analytics: 1,
  realtime_product_sync: 1,
  proactive_cart_recovery: 1,
  priority_support: 1,
  multiple_stores: 1,
  flows_automation: 1,
  custom_llm_training: 1,
  multi_language: 1,
  human_handoff_api: 1,
  unanswered_insights: 1,
  custom_reporting: 1,
  dedicated_manager: 1,
  white_label: 1,
  sso: 1,
  custom_integrations: 1,
  sla: 1,
  unlimited: 1,
};

export function getPlanLevel(plan: string): number {
  return PLAN_LEVELS[plan.toLowerCase()] ?? 0;
}

export function hasFeature(feature: string, plan: string): boolean {
  const featureLevel = FEATURE_PLANS[feature];
  if (featureLevel === undefined) return true;
  return getPlanLevel(plan) >= featureLevel;
}
