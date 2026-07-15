import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBusiness } from "@/lib/business.functions";
import { useEffect, useRef, useState } from "react";
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
import { MONTHLY_PLAN_LIMIT, monthlyRemainingLabel, detailedRemainingLabel } from "@/lib/plan-limits";
import { UpgradeLock } from "@/components/upgrade-lock";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "Generate plan — Luzo AI" }] }),
  component: GeneratePage,
});

const MAX_POSTS_PER_WEEK = 7;

function GeneratePage() {
  const bizFn = useServerFn(getMyBusiness);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: biz, isLoading } = useQuery({ queryKey: ["business"], queryFn: () => bizFn() });
  const usage = useUsage();

  const [month, setMonth] = useState("");
  const [postsPerWeek, setPostsPerWeek] = useState(4);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveText, setLiveText] = useState("");
  const liveRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.scrollTop = liveRef.current.scrollHeight;
    }
  }, [liveText]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!month.trim()) {
      toast.error("Give your plan a name first.");
      return;
    }
    setBusy(true);
    setLiveText("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("You need to sign in again.");

      const res = await fetch("/api/public/generate-plan-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          month: month.trim(),
          postsPerWeek,
          extraNotes: notes || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(errText || `Generation failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let planId: string | null = null;
      let errorMessage: string | null = null;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const msg = JSON.parse(payload) as
                | { type: "start" }
                | { type: "chunk"; text: string }
                | { type: "done"; planId: string }
                | { type: "error"; message: string };
              if (msg.type === "chunk") {
                setLiveText((prev) => prev + msg.text);
              } else if (msg.type === "done") {
                planId = msg.planId;
              } else if (msg.type === "error") {
                errorMessage = msg.message;
              }
            } catch {
              /* ignore */
            }
          }
        }
      }

      if (errorMessage) throw new Error(errorMessage);
      if (!planId) throw new Error("Generation ended without a plan.");

      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Your plan is ready.");
      nav({ to: "/plan/$id", params: { id: planId } });
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
        {usage.data && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-muted-foreground">
              {monthlyRemainingLabel(usage.data.tier, usage.data.monthlyPlansUsed)}
            </span>
            <span className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-muted-foreground">
              {detailedRemainingLabel(usage.data.tier, usage.data.detailedUsed)}
            </span>
          </div>
        )}
      </div>

      {usage.data &&
        MONTHLY_PLAN_LIMIT[usage.data.tier] !== null &&
        usage.data.monthlyPlansUsed >= (MONTHLY_PLAN_LIMIT[usage.data.tier] as number) && (
          <UpgradeLock
            title="You've used your free monthly plan"
            description="Upgrade to Pro or VIP for unlimited monthly content plans."
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

        {(busy || liveText) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Live generation
              </Label>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
            <pre
              ref={liveRef}
              className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground"
            >
              {liveText || "Waiting for Luzo to start writing…"}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}