import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lumo AI" },
      { name: "description", content: "Simple plans for creators, founders, and agencies. Start free." },
      { property: "og:title", content: "Pricing — Lumo AI" },
      { property: "og:description", content: "Simple plans for creators, founders, and agencies. Start free." },
    ],
  }),
  component: Pricing,
});

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    tag: "Try Lumo",
    desc: "For solo creators just getting started.",
    features: ["1 business profile", "2 plans / month", "Basic hooks + captions", "Post history"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    tag: "Most popular",
    desc: "For founders posting weekly across platforms.",
    features: [
      "3 business profiles",
      "Unlimited monthly plans",
      "Advanced video/photo concepts",
      "Priority AI generation",
      "Full post history",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$59",
    tag: "For teams",
    desc: "For agencies managing multiple brands.",
    features: [
      "10 business profiles",
      "Unlimited plans + regenerations",
      "Team seats (coming soon)",
      "White-label export (coming soon)",
    ],
    cta: "Choose Studio",
    highlight: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-primary">Pricing</div>
            <h1 className="mt-3 text-display text-5xl font-semibold sm:text-6xl">
              One tool. Every plan you'll need.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Start free. Upgrade when you're ready to post every week.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={
                  "relative flex flex-col rounded-2xl border p-8 " +
                  (p.highlight
                    ? "border-primary bg-card glow-lime"
                    : "border-border bg-card")
                }
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-display text-2xl">{p.name}</span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest " +
                      (p.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground")
                    }
                  >
                    {p.tag}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-display text-5xl font-semibold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={p.highlight ? "default" : "secondary"}
                  className="mt-8 w-full"
                >
                  <Link to="/auth">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Prices shown are for illustration. Billing is not enabled yet in this preview.
          </p>
        </div>
      </section>
    </div>
  );
}