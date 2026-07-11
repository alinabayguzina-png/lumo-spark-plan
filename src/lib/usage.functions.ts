import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeTier, type PlanTier } from "./plan-limits";

export type UsageInfo = {
  tier: PlanTier;
  monthlyPlansUsed: number;
  detailedUsed: number;
};

export const getMyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsageInfo> => {
    const { supabase: sb, userId } = context;

    const [profileRes, plansRes, detailedRes] = await Promise.all([
      sb.from("profiles").select("plan").eq("id", userId).maybeSingle(),
      sb.from("content_plans").select("id", { count: "exact", head: true }).eq("user_id", userId),
      sb.from("detailed_plans").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (plansRes.error) throw new Error(plansRes.error.message);
    if (detailedRes.error) throw new Error(detailedRes.error.message);

    return {
      tier: normalizeTier(profileRes.data?.plan ?? "free"),
      monthlyPlansUsed: plansRes.count ?? 0,
      detailedUsed: detailedRes.count ?? 0,
    };
  });