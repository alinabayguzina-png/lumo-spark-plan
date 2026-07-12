export type PlanTier = "free" | "pro" | "vip";

export const PLAN_LABEL: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  vip: "VIP",
};

/** Max monthly-plan generations. `null` = unlimited. */
export const MONTHLY_PLAN_LIMIT: Record<PlanTier, number | null> = {
  free: 1,
  pro: null,
  vip: null,
};

/** Max detailed per-post generations. `null` = unlimited. */
export const DETAILED_LIMIT: Record<PlanTier, number | null> = {
  free: 0,
  pro: 15,
  vip: null,
};

export function canEditDetailed(tier: PlanTier) {
  return tier === "vip";
}

export function normalizeTier(raw: string | null | undefined): PlanTier {
  if (raw === "pro") return "pro";
  if (raw === "vip") return "vip";
  return "free";
}

export function detailedRemainingLabel(tier: PlanTier, used: number): string {
  const limit = DETAILED_LIMIT[tier];
  if (limit === null) return "Unlimited content generations";
  if (limit === 0) return "Content generations: Pro/VIP only";
  return `Content generations: ${Math.max(0, limit - used)} left`;
}

export function monthlyRemainingLabel(tier: PlanTier, used: number): string {
  const limit = MONTHLY_PLAN_LIMIT[tier];
  if (limit === null) return "Unlimited monthly plans";
  return `Monthly plans: ${Math.max(0, limit - used)} / ${limit}`;
}