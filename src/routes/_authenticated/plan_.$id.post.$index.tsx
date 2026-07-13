import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlan } from "@/lib/plans.functions";
import {
  getDetailed,
  generateDetailed,
  regenerateDetailed,
  updateDetailed,
} from "@/lib/detailed.functions";
import { useUsage } from "@/components/usage-badge";
import { UpgradeLock } from "@/components/upgrade-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Copy,
  Film,
  Layers,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import {
  DETAILED_LIMIT,
  canEditDetailed,
  detailedRemainingLabel,
} from "@/lib/plan-limits";

export const Route = createFileRoute("/_authenticated/plan_/$id/post/$index")({
  head: () => ({ meta: [{ title: "Execution plan — Luzo AI" }] }),
  component: PostDetailPage,
});

type PostItem = {
  day?: number;
  date?: string;
  time?: string;
  platform?: string;
  format?: string;
  pillar?: string;
  hook?: string;
  concept?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
};

type Kind = "video" | "slides" | "post";

function detectKind(post: PostItem | undefined): Kind {
  const fmt = (post?.format ?? "").toLowerCase();
  const plat = (post?.platform ?? "").toLowerCase();
  if (/reel|short|tiktok|video|vlog/.test(fmt)) return "video";
  if (/carousel|slide/.test(fmt)) return "slides";
  if (plat === "tiktok" && /photo/.test(fmt)) return "slides";
  if (plat === "instagram" && /photo/.test(fmt) && !/reel/.test(fmt)) return "slides";
  return "post";
}

function PostDetailPage() {
  const { id, index } = Route.useParams();
  const postIndex = Number(index);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getPlanFn = useServerFn(getPlan);
  const getDetailedFn = useServerFn(getDetailed);
  const generateFn = useServerFn(generateDetailed);
  const regenerateFn = useServerFn(regenerateDetailed);
  const updateFn = useServerFn(updateDetailed);

  const planQ = useQuery({
    queryKey: ["plan", id],
    queryFn: () => getPlanFn({ data: { id } }),
  });
  const detailedQ = useQuery({
    queryKey: ["detailed", id, postIndex],
    queryFn: () => getDetailedFn({ data: { planId: id, postIndex } }),
  });
  const usageQ = useUsage();

  const body = planQ.data?.posts as { items?: PostItem[] } | undefined;
  const post = body?.items?.[postIndex];
  const kind = useMemo(() => detectKind(post), [post]);

  const [videoLength, setVideoLength] = useState<string>("");
  const [slideCount, setSlideCount] = useState<string>("");
  const [preferences, setPreferences] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    const input = (detailedQ.data?.input as
      | { videoLengthSec?: number | null; slideCount?: number | null; preferences?: string }
      | null) ?? null;
    if (input) {
      setVideoLength(input.videoLengthSec ? String(input.videoLengthSec) : "");
      setSlideCount(input.slideCount ? String(input.slideCount) : "");
      setPreferences(input.preferences ?? "");
    }
  }, [detailedQ.data?.id]);

  if (planQ.isLoading || detailedQ.isLoading) {
    return <div className="text-muted-foreground">Loading…</div>;
  }
  if (!planQ.data) return <div className="text-muted-foreground">Plan not found.</div>;
  if (!post) return <div className="text-muted-foreground">Post not found in this plan.</div>;

  const detailed = detailedQ.data;
  const content = detailed?.content as Record<string, unknown> | undefined;

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await generateFn({
        data: {
          planId: id,
          postIndex,
          videoLengthSec: kind === "video" && videoLength ? Number(videoLength) : undefined,
          slideCount: kind === "slides" && slideCount ? Number(slideCount) : undefined,
          preferences: preferences || undefined,
        },
      });
      qc.invalidateQueries({ queryKey: ["detailed", id, postIndex] });
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Execution plan ready.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegenerate() {
    setBusy(true);
    try {
      await regenerateFn({
        data: {
          planId: id,
          postIndex,
          videoLengthSec: kind === "video" && videoLength ? Number(videoLength) : undefined,
          slideCount: kind === "slides" && slideCount ? Number(slideCount) : undefined,
          preferences: preferences || undefined,
        },
      });
      qc.invalidateQueries({ queryKey: ["detailed", id, postIndex] });
      toast.success("Regenerated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit() {
    try {
      const parsed = JSON.parse(draft);
      await updateFn({ data: { planId: id, postIndex, content: parsed } });
      qc.invalidateQueries({ queryKey: ["detailed", id, postIndex] });
      setEditing(false);
      toast.success("Saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid JSON or save failed.");
    }
  }

  const tier = usageQ.data?.tier ?? "free";
  const detailedLimit = DETAILED_LIMIT[tier];
  const detailedUsed = usageQ.data?.detailedUsed ?? 0;
  const outOfQuota =
    detailedLimit !== null && detailedUsed >= detailedLimit && !detailed;
  const freeBlocked = false;

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate({ to: "/plan/$id", params: { id } })}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to plan
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.22em] text-primary">
              {post.platform ?? "Post"} · {post.format ?? "—"} · {kind}
            </div>
            <h1 className="mt-1 text-display text-3xl font-semibold sm:text-4xl">
              {post.hook ?? "Untitled post"}
            </h1>
            {post.concept && (
              <p className="mt-2 text-sm text-muted-foreground">{post.concept}</p>
            )}
          </div>
          <div className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
            {detailedRemainingLabel(tier, detailedUsed)}
          </div>
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={onGenerate} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <KindIcon kind={kind} />
          {kind === "video" && "Video execution plan — optional inputs"}
          {kind === "slides" && "Slide-by-slide plan — optional inputs"}
          {kind === "post" && "Single-post execution plan — optional inputs"}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {kind === "video" && (
            <div className="space-y-1.5">
              <Label>Video length (seconds)</Label>
              <Input
                type="number"
                min={3}
                max={600}
                placeholder="e.g. 30"
                value={videoLength}
                onChange={(e) => setVideoLength(e.target.value)}
              />
            </div>
          )}
          {kind === "slides" && (
            <div className="space-y-1.5">
              <Label>Number of photos / slides</Label>
              <Input
                type="number"
                min={1}
                max={20}
                placeholder="e.g. 7"
                value={slideCount}
                onChange={(e) => setSlideCount(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Additional preferences (optional)</Label>
            <Textarea
              rows={3}
              maxLength={2000}
              placeholder="Tone, style, references, must-include lines or products, banned phrases…"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>
        </div>

        {outOfQuota ? (
          <UpgradeLock
            title={
              tier === "free"
                ? "You've used your free Execution Plan"
                : "You've hit the Pro limit (15 Execution Plans)"
            }
            description={
              tier === "free"
                ? "Upgrade to Pro for 15 Execution Plans a month, or VIP for unlimited + editing & regeneration."
                : "Upgrade to VIP for unlimited Execution Plans + editing + regeneration."
            }
          />
        ) : (
          <Button type="submit" disabled={busy} size="lg" className="w-full sm:w-auto">
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {detailed ? "Regenerate Execution Plan" : "Generate Execution Plan"}
              </>
            )}
          </Button>
        )}

        {detailed && canEditDetailed(tier) && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="secondary" size="sm" onClick={onRegenerate} disabled={busy}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> VIP regenerate with new inputs
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(JSON.stringify(content ?? {}, null, 2));
                setEditing(true);
              }}
            >
              <Wand2 className="mr-2 h-3.5 w-3.5" /> VIP edit raw plan
            </Button>
          </div>
        )}
        {detailed && !canEditDetailed(tier) && (
          <UpgradeLock
            title="Editing & regenerating this plan is VIP only"
            description="VIP unlocks unlimited detailed plans plus the ability to edit and regenerate any post."
            className="mt-2"
          />
        )}
      </form>

      {/* Output */}
      {detailed ? (
        editing ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <Label>Raw JSON (VIP editor)</Label>
            <Textarea
              rows={20}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-2 font-mono text-xs"
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={onSaveEdit} size="sm">
                <Save className="mr-2 h-3.5 w-3.5" /> Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <RenderContent kind={(detailed.kind as Kind) ?? kind} content={content ?? {}} />
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No execution plan yet. Fill the inputs (all optional) and click generate.
        </div>
      )}

      <div className="pt-6 text-center text-xs text-muted-foreground">
        <Link to="/pricing" className="underline hover:text-foreground">
          Manage your plan
        </Link>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: Kind }) {
  if (kind === "video") return <Video className="h-4 w-4 text-primary" />;
  if (kind === "slides") return <Layers className="h-4 w-4 text-primary" />;
  return <Camera className="h-4 w-4 text-primary" />;
}

function copy(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied."));
}

/* -------------------- Rendering -------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 text-xs uppercase tracking-[0.22em] text-primary">{title}</div>
      {children}
    </section>
  );
}

function Chips({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s, i) => (
        <span key={i} className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
          {s}
        </span>
      ))}
    </div>
  );
}

function RenderContent({ kind, content }: { kind: Kind; content: Record<string, unknown> }) {
  if (kind === "video") return <VideoContent c={content as any} />;
  if (kind === "slides") return <SlidesContent c={content as any} />;
  return <PostContent c={content as any} />;
}

type Scene = {
  range?: string;
  startSec?: number;
  endSec?: number;
  script?: string;
  onScreenText?: string;
  visual?: string;
  cameraShot?: string;
  cameraAngle?: string;
  bRoll?: string[];
  editingMove?: string;
  sfx?: string;
  retentionTip?: string;
};

function VideoContent({ c }: { c: any }) {
  const scenes: Scene[] = Array.isArray(c?.scenes) ? c.scenes : [];
  return (
    <div className="space-y-6">
      {c?.summary && (
        <Section title="The pitch">
          <p className="text-lg leading-snug">{c.summary}</p>
          {c?.hookAnalysis && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Hook: </span>
              {c.hookAnalysis}
            </p>
          )}
        </Section>
      )}

      <Section title={`Scene-by-scene ${c?.totalDurationSec ? `· ~${c.totalDurationSec}s` : ""}`}>
        <ol className="space-y-4">
          {scenes.map((s, i) => (
            <li key={i} className="relative rounded-xl border border-border/70 bg-background/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Film className="h-3.5 w-3.5 text-primary" />
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {s.range ?? `${s.startSec ?? "?"}–${s.endSec ?? "?"} sec`}
                </span>
                {s.editingMove && <span>· {s.editingMove}</span>}
              </div>
              <FieldRow label="Script / voiceover" value={s.script} copyable />
              <FieldRow label="On-screen text" value={s.onScreenText} />
              <FieldRow label="Visual" value={s.visual} />
              <FieldRow label="Camera" value={[s.cameraShot, s.cameraAngle].filter(Boolean).join(" · ")} />
              {s.bRoll?.length ? (
                <FieldRow label="B-roll" value={s.bRoll.join(" · ")} />
              ) : null}
              <FieldRow label="SFX / music beat" value={s.sfx} />
              {s.retentionTip && (
                <p className="mt-2 text-xs italic text-primary/80">▸ {s.retentionTip}</p>
              )}
            </li>
          ))}
        </ol>
      </Section>

      {c?.musicDirection && (
        <Section title="Music direction">
          <p className="text-sm">{c.musicDirection}</p>
        </Section>
      )}

      {c?.editingStyle && (
        <Section title="Editing style">
          <p className="text-sm">{c.editingStyle}</p>
        </Section>
      )}

      <Section title="Caption">
        <div className="rounded-md bg-background/60 p-3 text-sm whitespace-pre-wrap">
          {c?.caption ?? "—"}
        </div>
        {c?.caption && (
          <button
            onClick={() => copy(String(c.caption))}
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Copy className="h-3 w-3" /> Copy caption
          </button>
        )}
        {c?.hashtags?.length ? (
          <div className="mt-3 text-xs text-primary/90">{c.hashtags.join(" ")}</div>
        ) : null}
        {c?.cta && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="uppercase tracking-widest text-[10px]">CTA · </span>
            {c.cta}
          </p>
        )}
      </Section>

      {(c?.viralTips?.length || c?.retentionTactics?.length) && (
        <Section title="Viral tips & retention tactics">
          {c?.viralTips?.length ? (
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm">
              {c.viralTips.map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : null}
          <Chips items={c?.retentionTactics} />
        </Section>
      )}

      {c?.postingTip && (
        <Section title="Posting tip">
          <p className="text-sm">{c.postingTip}</p>
        </Section>
      )}
    </div>
  );
}

function SlidesContent({ c }: { c: any }) {
  const slides: Array<any> = Array.isArray(c?.slides) ? c.slides : [];
  return (
    <div className="space-y-6">
      {c?.summary && (
        <Section title="The pitch">
          <p className="text-lg">{c.summary}</p>
          {c?.coverStrategy && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Cover: </span>
              {c.coverStrategy}
            </p>
          )}
        </Section>
      )}

      <Section title={`Slides · ${slides.length}`}>
        <ol className="grid gap-4 md:grid-cols-2">
          {slides.map((s, i) => (
            <li key={i} className="rounded-xl border border-border/70 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Slide {s.index ?? i + 1}
                </span>
                {s.role && <span>· {s.role}</span>}
              </div>
              <FieldRow label="Photo direction" value={s.photoDirection} />
              <FieldRow label="On-slide text" value={s.onSlideText} copyable />
              <FieldRow label="Typography" value={s.typography} />
              <FieldRow label="Layout" value={s.layout} />
              <FieldRow label="Color / mood" value={s.colorMood} />
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Caption">
        <div className="rounded-md bg-background/60 p-3 text-sm whitespace-pre-wrap">
          {c?.caption ?? "—"}
        </div>
        {c?.hashtags?.length ? (
          <div className="mt-3 text-xs text-primary/90">{c.hashtags.join(" ")}</div>
        ) : null}
        {c?.cta && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="uppercase tracking-widest text-[10px]">CTA · </span>
            {c.cta}
          </p>
        )}
      </Section>

      {(c?.viralTips?.length || c?.engagementHooks?.length) && (
        <Section title="Viral tips">
          {c?.viralTips?.length ? (
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm">
              {c.viralTips.map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : null}
          {c?.engagementHooks?.length ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              {c.engagementHooks.map((h: string, i: number) => (
                <p key={i}>▸ {h}</p>
              ))}
            </div>
          ) : null}
        </Section>
      )}
    </div>
  );
}

function PostContent({ c }: { c: any }) {
  return (
    <div className="space-y-6">
      {c?.summary && (
        <Section title="The pitch">
          <p className="text-lg">{c.summary}</p>
          {c?.hookAnalysis && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Hook: </span>
              {c.hookAnalysis}
            </p>
          )}
        </Section>
      )}
      <Section title="Visual direction">
        <p className="text-sm">{c?.visualDirection ?? "—"}</p>
        {c?.onScreenText && (
          <p className="mt-3 text-sm">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">On-screen text · </span>
            {c.onScreenText}
          </p>
        )}
      </Section>
      <Section title="Caption">
        <div className="rounded-md bg-background/60 p-3 text-sm whitespace-pre-wrap">
          {c?.caption ?? "—"}
        </div>
        {c?.hashtags?.length ? (
          <div className="mt-3 text-xs text-primary/90">{c.hashtags.join(" ")}</div>
        ) : null}
        {c?.cta && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="uppercase tracking-widest text-[10px]">CTA · </span>
            {c.cta}
          </p>
        )}
      </Section>
      {c?.viralTips?.length ? (
        <Section title="Viral tips">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {c.viralTips.map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      ) : null}
      {c?.postingTip && (
        <Section title="Posting tip">
          <p className="text-sm">{c.postingTip}</p>
        </Section>
      )}
    </div>
  );
}

function FieldRow({ label, value, copyable }: { label: string; value?: string; copyable?: boolean }) {
  if (!value) return null;
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center gap-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        {copyable && (
          <button
            onClick={() => copy(value)}
            className="text-muted-foreground hover:text-primary"
            aria-label="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
      <p className="mt-0.5 text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}