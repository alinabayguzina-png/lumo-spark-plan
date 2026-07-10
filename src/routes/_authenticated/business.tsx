import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBusiness, upsertMyBusiness } from "@/lib/business.functions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({ meta: [{ title: "Business info — Lumo AI" }] }),
  component: BusinessPage,
});

const PLATFORMS = ["Instagram", "TikTok", "LinkedIn", "X", "YouTube Shorts", "Facebook"];

function BusinessPage() {
  const bizFn = useServerFn(getMyBusiness);
  const saveFn = useServerFn(upsertMyBusiness);
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ["business"], queryFn: () => bizFn() });

  const [form, setForm] = useState({
    business_name: "",
    industry: "",
    description: "",
    target_audience: "",
    brand_tone: "",
    goals: "",
    website: "",
    platforms: [] as string[],
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        business_name: data.business_name ?? "",
        industry: data.industry ?? "",
        description: data.description ?? "",
        target_audience: data.target_audience ?? "",
        brand_tone: data.brand_tone ?? "",
        goals: data.goals ?? "",
        website: data.website ?? "",
        platforms: data.platforms ?? [],
      });
    }
  }, [data]);

  function toggle(p: string) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name.trim()) return toast.error("Business name is required.");
    setBusy(true);
    try {
      await saveFn({ data: form });
      toast.success("Business info saved.");
      qc.invalidateQueries({ queryKey: ["business"] });
      nav({ to: "/generate" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-primary">Step 1</div>
        <h1 className="mt-1 text-display text-4xl font-semibold">Tell Lumo about your business.</h1>
        <p className="mt-2 text-muted-foreground">
          The more specific you are, the sharper the content plan.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name *">
            <Input
              value={form.business_name}
              maxLength={120}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              required
            />
          </Field>
          <Field label="Industry">
            <Input
              value={form.industry}
              maxLength={120}
              placeholder="e.g. Specialty coffee"
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </Field>
        </div>

        <Field label="What does your business do?">
          <Textarea
            value={form.description}
            maxLength={2000}
            rows={3}
            placeholder="Describe your product / service in a few sentences."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target audience">
            <Textarea
              value={form.target_audience}
              maxLength={500}
              rows={3}
              placeholder="Who exactly are you talking to?"
              onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
            />
          </Field>
          <Field label="Brand tone">
            <Textarea
              value={form.brand_tone}
              maxLength={200}
              rows={3}
              placeholder="e.g. warm, witty, expert"
              onChange={(e) => setForm({ ...form, brand_tone: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Growth goals">
          <Textarea
            value={form.goals}
            maxLength={1000}
            rows={3}
            placeholder="e.g. Grow IG to 10k, drive foot traffic on weekends."
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
          />
        </Field>

        <Field label="Website">
          <Input
            value={form.website}
            maxLength={200}
            placeholder="https://…"
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </Field>

        <div>
          <Label className="mb-3 block">Active platforms</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = form.platforms.includes(p);
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => toggle(p)}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                    (on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" disabled={busy} size="lg" className="w-full sm:w-auto">
          {busy ? "Saving…" : data ? "Save changes" : "Save & continue"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}