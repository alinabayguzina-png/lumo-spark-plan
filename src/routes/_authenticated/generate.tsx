import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBusiness } from "@/lib/business.functions";
import { generateContentPlan } from "@/lib/ai.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "Generate plan — Luzo AI" }] }),
  component: GeneratePage,
});

function currentMonthLabel() {
  return new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function GeneratePage() {
  const bizFn = useServerFn(getMyBusiness);
  const genFn = useServerFn(generateContentPlan);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: biz, isLoading } = useQuery({ queryKey: ["business"], queryFn: () => bizFn() });

  const [month, setMonth] = useState(currentMonthLabel());
  const [postsPerWeek, setPostsPerWeek] = useState(4);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await genFn({ data: { month, postsPerWeek, extraNotes: notes || undefined } });
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Your plan is ready.");
      nav({ to: "/plan/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
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
        <h1 className="mt-1 text-display text-4xl font-semibold">Generate a monthly plan.</h1>
        <p className="mt-2 text-muted-foreground">
          For <span className="text-foreground">{biz.business_name}</span> · Platforms:{" "}
          {biz.platforms?.length ? biz.platforms.join(", ") : "not set"}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              maxLength={40}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Posts per week</Label>
            <Input
              type="number"
              min={1}
              max={21}
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Anything specific this month? (optional)</Label>
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating your month…
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
      </form>
    </div>
  );
}