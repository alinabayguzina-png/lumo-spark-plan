import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBusiness } from "@/lib/business.functions";
import { listMyPlans } from "@/lib/plans.functions";
import { Button } from "@/components/ui/button";
import { Wand2, Building2, History, Crown } from "lucide-react";
import { useUsage } from "@/components/usage-badge";
import { PLAN_LABEL, detailedRemainingLabel } from "@/lib/plan-limits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Luzo AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const bizFn = useServerFn(getMyBusiness);
  const plansFn = useServerFn(listMyPlans);
  const biz = useQuery({ queryKey: ["business"], queryFn: () => bizFn() });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => plansFn() });
  const usage = useUsage();

  const hasBiz = !!biz.data;
  const recent = (plans.data ?? []).slice(0, 3);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-primary">Welcome back</div>
          <h1 className="mt-1 text-display text-4xl font-semibold">
            {biz.data?.business_name ?? "Your workspace"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {hasBiz
              ? "Your brand is ready. Generate a new monthly content plan whenever you like."
              : "Add your business info to unlock personalized content plans."}
          </p>
        </div>
        <Button asChild size="lg">
          <Link to={hasBiz ? "/generate" : "/business"}>
            {hasBiz ? "Generate this month's plan" : "Add business info"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Business"
          value={hasBiz ? "Ready" : "Missing"}
          to="/business"
        />
        <StatCard
          icon={<Wand2 className="h-5 w-5" />}
          label="Plans generated"
          value={String(plans.data?.length ?? 0)}
          to="/history"
        />
        <StatCard
          icon={<Crown className="h-5 w-5" />}
          label={usage.data ? detailedRemainingLabel(usage.data.tier, usage.data.detailedUsed) : "Plan"}
          value={usage.data ? PLAN_LABEL[usage.data.tier] : "Free"}
          to="/pricing"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display text-2xl">Recent plans</h2>
          <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <History className="mx-auto mb-3 h-6 w-6" />
            No plans yet. Generate your first one.
          </div>
        ) : (
          <div className="grid gap-3">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/plan/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/60"
              >
                <div>
                  <div className="font-display text-lg">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    {p.month ? ` · ${p.month}` : ""}
                  </div>
                </div>
                <span className="text-sm text-primary">Open →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  to: "/business" | "/history" | "/pricing";
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl">{value}</div>
    </Link>
  );
}