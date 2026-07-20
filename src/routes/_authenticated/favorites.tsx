import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyFavorites, toggleFavorite } from "@/lib/favorites.functions";
import { Button } from "@/components/ui/button";
import { Heart, Video, Camera, FileText, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — Luzo AI" }] }),
  component: FavoritesPage,
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

function iconFor(format?: string) {
  const f = (format ?? "").toLowerCase();
  if (f.includes("reel") || f.includes("short") || f.includes("tiktok") || f.includes("video"))
    return <Video className="h-4 w-4" />;
  if (f.includes("photo") || f.includes("story")) return <Camera className="h-4 w-4" />;
  if (f.includes("carousel")) return <Layers className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function FavoritesPage() {
  const listFn = useServerFn(listMyFavorites);
  const toggleFn = useServerFn(toggleFavorite);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["favorites"], queryFn: () => listFn() });

  async function remove(planId: string, postIndex: number) {
    try {
      await toggleFn({
        data: {
          planId,
          postIndex,
          postSnapshot: {},
        },
      });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favorite-keys"] });
      toast.success("Removed from Favorites.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove.");
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-primary">Saved</div>
          <h1 className="mt-1 text-display text-4xl font-semibold">Your Favorites</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Posts you've saved for later. Tap any card to open its full execution plan.
          </p>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Heart className="mx-auto mb-3 h-6 w-6" />
          Nothing saved yet. Tap the heart icon on any post to save it here.
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((fav) => {
            const post = fav.post_snapshot as PostItem;
            return (
              <article
                key={fav.id}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/60"
              >
                <Link
                  to="/plan/$id/post/$index"
                  params={{ id: fav.plan_id, index: String(fav.post_index) }}
                  className="absolute inset-0 z-10 rounded-2xl"
                  aria-label="Open execution plan"
                />
                <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
                      {iconFor(post.format)}
                    </span>
                    <span className="font-medium text-foreground">
                      {post.platform ?? "Post"}
                    </span>
                    <span>· {post.format ?? "—"}</span>
                    {post.pillar && <span>· {post.pillar}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="truncate">
                      From: {fav.plan_title ?? "Untitled plan"}
                    </span>
                    <button
                      onClick={() => remove(fav.plan_id, fav.post_index)}
                      className="relative z-30 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove from Favorites"
                      title="Remove from Favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {post.hook && (
                  <p className="mt-4 text-display text-xl leading-snug text-foreground">"{post.hook}"</p>
                )}
                {post.concept && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Concept</div>
                    <p className="mt-1 text-sm text-muted-foreground">{post.concept}</p>
                  </div>
                )}
                {post.caption && (
                  <div className="mt-4 rounded-md bg-background/50 p-3 text-sm whitespace-pre-wrap">
                    {post.caption}
                  </div>
                )}
                <div className="relative z-20 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {post.hashtags?.length ? (
                    <div className="text-primary/90">{post.hashtags.join(" ")}</div>
                  ) : null}
                  {post.cta && (
                    <div className="text-muted-foreground">
                      <span className="uppercase tracking-widest text-[10px]">CTA · </span>
                      {post.cta}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Button asChild variant="secondary">
          <Link to="/history">Back to all plans</Link>
        </Button>
      </div>
    </div>
  );
}
