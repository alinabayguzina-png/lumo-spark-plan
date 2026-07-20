import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBusiness } from "@/lib/business.functions";
import { generateContentPlan } from "@/lib/ai.functions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { useUsage } from "@/components/usage-badge";
import { WEEKLY_PLAN_LIMIT, weeklyRemainingLabel, detailedRemainingLabel } from "@/lib/plan-limits";
import { UpgradeLock } from "@/components/upgrade-lock";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "Generate plan — Luzo AI" }] }),
  component: GeneratePage,
});

const MAX_POSTS_PER_WEEK = 7;

const PROGRESS_STAGES = [
  { at: 8, label: "Analyzing brand…" },
  { at: 28, label: "Researching hooks & formats…" },
  { at: 50, label: "Creating content ideas…" },
  { at: 72, label: "Writing captions & concepts…" },
  { at: 90, label: "Finalizing plan…" },
];

function stageForProgress(p: number) {
  let label = PROGRESS_STAGES[PROGRESS_STAGES.length - 1].label;
  for (const s of PROGRESS_STAGES) {
    if (p < s.at) {
      label = s.label;
      break;
    }
  }
  return label;
}

function GeneratePage() {
  const bizFn = useServerFn(getMyBusiness);
  const generateFn = useServerFn(generateContentPlan);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: biz, isLoading } = useQuery({ queryKey: ["business"], queryFn: () => bizFn() });
  const usage = useUsage();

  const [month, setMonth] = useState("");
  const [postsPerWeek, setPostsPerWeek] = useState(4);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!busy) return;
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 7 + 2, 95);
      setProgress(p);
    }, 600);
    return () => clearInterval(interval);
  }, [busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!month.trim()) {
      toast.error("Give your plan a name first.");
      return;
    }
    setBusy(true);
    setProgress(2);
    try {
      const result = await generateFn({
        data: {
          month: month.trim(),
          postsPerWeek,
          extraNotes: notes || undefined,
        },
      });
      setProgress(100);
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Your plan is ready.");
      nav({ to: "/plan/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;

  if (!biz) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-10 text-center">
        <Sparkles className="mx-auto mb-4 h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl">Add your business first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Luzo needs to know your brand before it can draft a plan.
        </p>
        <Button asChild className="mt-6">
          <Link to="/business">Add business info</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-primary">Step 2</div>
        <h1 className="mt-1 text-display text-4xl font-semibold">Generate a weekly plan.</h1>
        <p className="mt-2 text-muted-foreground">
          For <span className="text-foreground">{biz.business_name}</span> · Platforms:{" "}
          {biz.platforms?.length ? biz.platforms.join(", ") : "not set"}
        </p>
        {usage.data && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-muted-foreground">
              {weeklyRemainingLabel(usage.data.tier, usage.data.monthlyPlansUsed)}
            </span>
            <span className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-muted-foreground">
              {detailedRemainingLabel(usage.data.tier, usage.data.detailedUsed)}
            </span>
          </div>
        )}
      </div>

      {usage.data &&
        WEEKLY_PLAN_LIMIT[usage.data.tier] !== null &&
        usage.data.monthlyPlansUsed >= (WEEKLY_PLAN_LIMIT[usage.data.tier] as number) && (
          <UpgradeLock
            title="You've used your free weekly plan"
            description="Upgrade to Pro or VIP for unlimited weekly content plans."
            className="mb-6"
          />
        )}
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              maxLength={80}
              placeholder="e.g. Summer launch"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Posts per week</Label>
            <Select
              value={String(postsPerWeek)}
              onValueChange={(v) => setPostsPerWeek(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: MAX_POSTS_PER_WEEK }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "post" : "posts"} / week
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Anything specific this week? (optional)</Label>
          <Textarea
            value={notes}
            maxLength={2000}
            rows={4}
            placeholder="Launches, holidays, promos, events to build content around."
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={busy} size="lg" className="w-full">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating your week…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Generate plan
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Usually takes 20–40 seconds.
        </p>

        {busy && (
          <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {stageForProgress(progress)}
              </Label>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
            <Progress value={progress} />
            <div className="text-right text-xs text-muted-foreground">
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
