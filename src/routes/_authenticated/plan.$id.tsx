import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlan } from "@/lib/plans.functions";
import { listFavoriteKeys, toggleFavorite } from "@/lib/favorites.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Camera, FileText, Layers, Copy, ArrowRight, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/plan/$id")({
  head: () => ({ meta: [{ title: "Content plan — Luzo AI" }] }),
  component: PlanPage,
});

type PostItem = {
  id?: string;
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

function iconFor(format?: string) {
  const f = (format ?? "").toLowerCase();
  if (f.includes("reel") || f.includes("short") || f.includes("tiktok") || f.includes("video"))
    return <Video className="h-4 w-4" />;
  if (f.includes("photo") || f.includes("story")) return <Camera className="h-4 w-4" />;
  if (f.includes("carousel")) return <Layers className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function PlanPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getPlan);
  const favKeysFn = useServerFn(listFavoriteKeys);
  const toggleFavFn = useServerFn(toggleFavorite);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["plan", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const { data: favKeys } = useQuery({
    queryKey: ["favorite-keys"],
    queryFn: () => favKeysFn(),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!data) return <div className="text-muted-foreground">Plan not found.</div>;

  const body = data.posts as { theme?: string; pillars?: string[]; items?: PostItem[] };
  const items = body?.items ?? [];
  const favSet = new Set(favKeys ?? []);

  async function copyPost(p: PostItem) {
    const text = [
      p.hook && `Hook: ${p.hook}`,
      p.concept && `Concept: ${p.concept}`,
      p.caption && `\n${p.caption}`,
      p.hashtags?.length && `\n${p.hashtags.join(" ")}`,
      p.cta && `\nCTA: ${p.cta}`,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Post copied.");
  }

  async function onToggleFav(index: number, post: PostItem) {
    const postId = post.id ?? `post_${index + 1}`;
    const key = `${id}:${postId}`;
    const wasFav = favSet.has(key);
    try {
      await toggleFavFn({
        data: {
          contentPlanId: id,
          postId,
          postData: { ...post, _index: index } as unknown as Record<string, unknown>,
        },
      });
      qc.invalidateQueries({ queryKey: ["favorite-keys"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(wasFav ? "Removed from Favorites." : "Saved to Favorites.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div>
      <Link to="/history" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All plans
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.22em] text-primary">{data.month}</div>
          <h1 className="mt-1 truncate text-display text-4xl font-semibold">{data.title}</h1>
          {body?.theme && (
            <p className="mt-2 text-muted-foreground italic">"{body.theme}"</p>
          )}
        </div>
        <Button asChild variant="secondary">
          <Link to="/generate">Generate another</Link>
        </Button>
      </header>

      {body?.pillars?.length ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {body.pillars.map((p) => (
            <span key={p} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              {p}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.map((p, i) => {
          const postId = p.id ?? `post_${i + 1}`;
          const favKey = `${id}:${postId}`;
          const isFav = favSet.has(favKey);
          return (
            <article
              key={i}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/60"
            >
              <Link
                to="/plan/$id/post/$index"
                params={{ id: data.id, index: String(i) }}
                className="absolute inset-0 z-10 rounded-2xl"
                aria-label="Open execution plan"
              />
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
                    {iconFor(p.format)}
                  </span>
                  <span className="font-medium text-foreground">
                    {p.platform ?? "Post"}
                  </span>
                  <span>· {p.format ?? "—"}</span>
                  {p.pillar && <span>· {p.pillar}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span>
                    {p.date ?? `Day ${p.day ?? i + 1}`}
                    {p.time ? ` · ${p.time}` : ""}
                  </span>
                  <button
                    onClick={() => onToggleFav(i, p)}
                    className="relative z-30 grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-primary/10"
                    aria-label={isFav ? "Remove from Favorites" : "Save to Favorites"}
                    title={isFav ? "Remove from Favorites" : "Save to Favorites"}
                  >
                    <Heart
                      className={
                        "h-4 w-4 transition-all " +
                        (isFav
                          ? "fill-primary text-primary scale-110"
                          : "text-muted-foreground hover:text-primary")
                      }
                    />
                  </button>
                  <button
                    onClick={() => copyPost(p)}
                    className="relative z-30 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:border-primary/60 hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>

              {p.hook && (
                <p className="mt-4 text-display text-xl leading-snug text-foreground">"{p.hook}"</p>
              )}
              {p.concept && (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Concept</div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.concept}</p>
                </div>
              )}
              {p.caption && (
                <div className="mt-4 rounded-md bg-background/50 p-3 text-sm whitespace-pre-wrap">
                  {p.caption}
                </div>
              )}
              <div className="relative z-20 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                {p.hashtags?.length ? (
                  <div className="text-primary/90">{p.hashtags.join(" ")}</div>
                ) : null}
                {p.cta && (
                  <div className="text-muted-foreground">
                    <span className="uppercase tracking-widest text-[10px]">CTA · </span>
                    {p.cta}
                  </div>
                )}
              </div>
              <div className="relative z-20 mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                <span className="text-muted-foreground">
                  Tap for a full scene-by-scene execution plan
                </span>
                <span className="inline-flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
