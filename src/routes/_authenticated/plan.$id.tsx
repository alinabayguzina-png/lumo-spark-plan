import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlan } from "@/lib/plans.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Camera, FileText, Layers, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/plan/$id")({
  head: () => ({ meta: [{ title: "Content plan — Lumo AI" }] }),
  component: PlanPage,
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

function PlanPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getPlan);
  const { data, isLoading } = useQuery({
    queryKey: ["plan", id],
    queryFn: () => getFn({ data: { id } }),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!data) return <div className="text-muted-foreground">Plan not found.</div>;

  const body = data.posts as { theme?: string; pillars?: string[]; items?: PostItem[] };
  const items = body?.items ?? [];

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
        {items.map((p, i) => (
          <article
            key={i}
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-xs text-muted-foreground">
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
                  onClick={() => copyPost(p)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:border-primary/60 hover:text-foreground"
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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
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
          </article>
        ))}
      </div>
    </div>
  );
}