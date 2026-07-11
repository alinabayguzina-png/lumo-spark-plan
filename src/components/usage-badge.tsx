import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyUsage } from "@/lib/usage.functions";
import { Link } from "@tanstack/react-router";
import { DETAILED_LIMIT, PLAN_LABEL, detailedRemainingLabel } from "@/lib/plan-limits";
import { Sparkles } from "lucide-react";

export function useUsage() {
  const fn = useServerFn(getMyUsage);
  return useQuery({ queryKey: ["usage"], queryFn: () => fn(), staleTime: 15_000 });
}

export function UsageBadge({ compact = false }: { compact?: boolean }) {
  const { data } = useUsage();
  if (!data) return null;
  const label = detailedRemainingLabel(data.tier, data.detailedUsed);
  const unlimited = DETAILED_LIMIT[data.tier] === null;
  return (
    <Link
      to="/pricing"
      className={
        "inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs " +
        (unlimited ? "text-primary" : "text-muted-foreground hover:text-foreground")
      }
      title="Manage plan"
    >
      <Sparkles className="h-3 w-3" />
      {compact ? (unlimited ? "Unlimited" : label.replace("Detailed generations: ", "")) : label}
      <span className="hidden text-foreground/60 sm:inline">· {PLAN_LABEL[data.tier]}</span>
    </Link>
  );
}