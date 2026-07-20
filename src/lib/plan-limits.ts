export type PlanTier = "free" | "pro" | "vip";

export const PLAN_LABEL: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  vip: "VIP",
};

/** Max weekly-plan generations. `null` = unlimited. */
export const WEEKLY_PLAN_LIMIT: Record<PlanTier, number | null> = {
  free: 1,
  pro: null,
  vip: null,
};

/** Max detailed per-post generations. `null` = unlimited. */
export const DETAILED_LIMIT: Record<PlanTier, number | null> = {
  free: 1,
  pro: 15,
  vip: null,
};

// Hidden fair-use caps for paid plans. NOT surfaced in the UI.
// When exceeded, the server returns a generic transient error.
export const HIDDEN_WEEKLY_CAP: Record<PlanTier, number | null> = {
  free: null,
  pro: 40,
  vip: 60,
};

export const HIDDEN_DETAILED_CAP: Record<PlanTier, number | null> = {
  free: null,
  pro: null,
  vip: 40,
};

export const GENERIC_LIMIT_ERROR =
  "Generation is temporarily unavailable. Please try again in a few minutes.";

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
  if (limit === null) return "Unlimited Execution Plans";
  return `Execution Plans: ${Math.max(0, limit - used)} / ${limit} left`;
}

export function weeklyRemainingLabel(tier: PlanTier, used: number): string {
  const limit = WEEKLY_PLAN_LIMIT[tier];
  if (limit === null) return "Unlimited Weekly Plans";
  return `Weekly Plan Generations: ${Math.max(0, limit - used)} / ${limit} left`;
}