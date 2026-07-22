import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Luzo AI" },
      { name: "description", content: "Simple plans for creators, founders, and agencies. Start free." },
      { property: "og:title", content: "Pricing — Luzo AI" },
      { property: "og:description", content: "Simple plans for creators, founders, and agencies. Start free." },
    ],
  }),
  component: Pricing,
});

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    tag: "Try Luzo",
    desc: "For solo creators just getting started.",
    features: [
      "1 Weekly Content Plan",
      "1 Execution Plan",
      "Basic hooks + captions",
      "Post history",
    ],
    cta: "Start free",
    planKey: null as "pro" | "vip" | null,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    tag: "Most popular",
    desc: "For founders posting weekly across platforms.",
    features: [
      "Unlimited Weekly Content Plans",
      "15 Execution Plans / month",
      "Scene-by-scene video breakdowns",
      "Slide-by-slide carousel plans",
      "Priority AI generation",
    ],
    cta: "Choose Pro",
    planKey: "pro" as const,
    highlight: true,
  },
  {
    name: "VIP",
    price: "$19",
    tag: "For power users",
    desc: "For creators serious about going viral.",
    features: [
      "Unlimited Weekly Content Plans",
      "Unlimited Execution Plans",
      "Edit & regenerate any post",
      "Advanced viral tactics + retention loops",
      "First access to new features",
    ],
    cta: "Go VIP",
    planKey: "vip" as const,
    highlight: false,
  },
];

function Pricing() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "vip" | null>(null);

  async function handleCheckout(plan: "pro" | "vip") {
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }

    setCheckoutLoading(plan);
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
      const res = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          plan,
          origin: window.location.origin,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error ?? `Checkout failed (${res.status})`);
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
      setCheckoutLoading(null);
    }
  }

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
            {PLANS.map((p) => {
              const isPaid = p.planKey !== null;
              const isLoading = checkoutLoading === p.planKey;
              const showCheckout = isPaid && session && !loading;
              const showAuthLink = isPaid && (!session || loading);

              return (
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

                  {showCheckout ? (
                    <Button
                      variant={p.highlight ? "default" : "secondary"}
                      className="mt-8 w-full"
                      disabled={checkoutLoading !== null}
                      onClick={() => p.planKey && handleCheckout(p.planKey)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        p.cta
                      )}
                    </Button>
                  ) : showAuthLink ? (
                    <Button
                      asChild
                      variant={p.highlight ? "default" : "secondary"}
                      className="mt-8 w-full"
                    >
                      <Link to="/auth">{p.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant={p.highlight ? "default" : "secondary"}
                      className="mt-8 w-full"
                    >
                      <Link to="/auth">{p.cta}</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Prices shown are for illustration. Billing is not enabled yet in this preview.
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need help? Contact our support team:{" "}
            <a href="mailto:luzoaisupport@gmail.com" className="text-primary hover:underline">
              luzoaisupport@gmail.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
