import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Calendar, BarChart3, Video, Camera, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.92 0.22 128 / 0.6), transparent)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Content Strategist
            </span>
            <h1 className="text-display text-5xl font-semibold text-foreground sm:text-7xl">
              A month of scroll-<span className="italic text-primary">stopping</span> content, in one click.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Lumo AI studies your business and generates a full month of video and photo ideas
              designed to grow your brand — hooks, concepts, captions and posting times, ready to shoot.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-52">
                <Link to="/auth">
                  Generate my plan <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to start · No credit card · Cancel anytime
            </p>
          </div>

          {/* Preview card */}
          <div className="relative mx-auto mt-20 max-w-4xl">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">March plan</div>
                  <div className="font-display text-2xl">Elm & Oak Café</div>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                  24 posts · 3 platforms
                </span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {SAMPLE_POSTS.map((p) => (
                  <div key={p.title} className="rounded-lg border border-border/70 bg-background/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {p.icon} <span>{p.platform}</span> · <span>{p.format}</span>
                    </div>
                    <div className="font-display text-base leading-snug">{p.title}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{p.hook}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.22em] text-primary">How it works</div>
            <h2 className="mt-3 text-display text-4xl font-semibold sm:text-5xl">
              Three steps to a full month of content.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                    {s.icon}
                  </div>
                  <span className="font-display text-4xl text-muted-foreground/40">0{i + 1}</span>
                </div>
                <h3 className="font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/60 bg-secondary/20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-16 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-primary">Built for growth</div>
              <h2 className="mt-3 text-display text-4xl font-semibold sm:text-5xl">
                Content built to <span className="italic">travel</span>.
              </h2>
              <p className="mt-6 text-muted-foreground">
                Every post is engineered with a proven hook, a specific visual concept you can actually shoot,
                and platform-native formatting. No generic "post a quote" ideas.
              </p>
            </div>
            <ul className="space-y-4">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-display text-4xl font-semibold sm:text-5xl">Frequently asked</h2>
          <div className="mt-10 divide-y divide-border">
            {FAQS.map((q) => (
              <div key={q.q} className="py-6">
                <div className="font-display text-lg">{q.q}</div>
                <p className="mt-2 text-sm text-muted-foreground">{q.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-display text-4xl font-semibold sm:text-5xl">
            Your next month of content, generated tonight.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Add your business in 2 minutes. Get a plan in 30 seconds.
          </p>
          <Button asChild size="lg" className="mt-8 min-w-52">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Lumo AI. Built for creators.</span>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <a href="/#faq" className="hover:text-foreground">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const SAMPLE_POSTS = [
  {
    platform: "Instagram",
    format: "Reel",
    title: "3 things nobody tells you about opening a café",
    hook: "POV: your first month behind the counter…",
    icon: <Video className="h-3.5 w-3.5 text-primary" />,
  },
  {
    platform: "TikTok",
    format: "Short",
    title: "Latte art fails → wins (60 seconds)",
    hook: "First try vs after 100 hours of practice.",
    icon: <Camera className="h-3.5 w-3.5 text-primary" />,
  },
  {
    platform: "LinkedIn",
    format: "Carousel",
    title: "The unit economics of a neighborhood café",
    hook: "We hit $10k months. Here's the breakdown.",
    icon: <BarChart3 className="h-3.5 w-3.5 text-primary" />,
  },
];

const STEPS = [
  {
    title: "Tell us about your business",
    body: "Name, industry, audience, tone, goals, platforms. Two minutes of setup.",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    title: "Generate your month",
    body: "Lumo studies your brand and drafts a full month of video and photo posts.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Shoot, post, repeat",
    body: "Every idea comes with a hook, concept, caption, hashtags and posting time.",
    icon: <Calendar className="h-5 w-5" />,
  },
];

const FEATURES = [
  "Hooks written to survive the first 2 seconds of a scroll",
  "Video and photo concepts, not generic ‘post a quote’ ideas",
  "Platform-native formatting for Reels, TikTok, Shorts, LinkedIn, X",
  "Balanced content pillars: education, entertainment, social proof, BTS",
  "Suggested posting dates and times for the whole month",
  "History of every plan you've ever generated",
];

const FAQS = [
  { q: "Do I need to be a designer or writer?", a: "No. Lumo hands you hooks, captions and shot lists — you just point a camera." },
  { q: "Which platforms does Lumo cover?", a: "Instagram, TikTok, LinkedIn, X and YouTube Shorts. You pick which ones matter." },
  { q: "How is a month structured?", a: "Roughly 4 posts/week across your platforms, balanced across content pillars." },
  { q: "Can I regenerate a plan?", a: "Yes — every plan is saved to your history and you can generate a new one anytime." },
];
  );
}
