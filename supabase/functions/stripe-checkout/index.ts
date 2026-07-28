import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // ── Secret presence check (values never logged) ──────────────────────────
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID") ?? "price_1TvnN1DE7Dg6n9MX8u8Gk9qC";
    const vipPriceId = Deno.env.get("STRIPE_VIP_PRICE_ID") ?? "price_1TvnO3DE7Dg6n9MXr4X28qeB";

    console.log("[stripe-checkout] secret check:", {
      STRIPE_SECRET_KEY: stripeSecretKey ? "present" : "MISSING",
      STRIPE_PRO_PRICE_ID: Deno.env.get("STRIPE_PRO_PRICE_ID") ? "present (env)" : "using hardcoded fallback",
      STRIPE_VIP_PRICE_ID: Deno.env.get("STRIPE_VIP_PRICE_ID") ? "present (env)" : "using hardcoded fallback",
      proPriceId,
      vipPriceId,
    });

    // ── Test vs live mode ─────────────────────────────────────────────────────
    if (stripeSecretKey) {
      const mode = stripeSecretKey.startsWith("sk_live_")
        ? "LIVE"
        : stripeSecretKey.startsWith("sk_test_")
        ? "TEST"
        : "UNKNOWN";
      const proMode = proPriceId.startsWith("price_") ? "unknown (need Stripe lookup)" : "unknown";
      console.log("[stripe-checkout] key mode:", mode, "| pro price ID:", proPriceId, "| vip price ID:", vipPriceId);
      if (mode === "LIVE") {
        console.warn("[stripe-checkout] WARNING: using LIVE key — make sure price IDs are also LIVE mode prices");
      } else if (mode === "TEST") {
        console.log("[stripe-checkout] TEST mode — make sure price IDs are also TEST mode prices");
      }
    }

    if (!stripeSecretKey) {
      console.error("[stripe-checkout] STRIPE_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY in Supabase Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[stripe-checkout] missing or malformed Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      console.error("[stripe-checkout] auth.getUser failed:", userErr?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // ── Parse body — accept both "tier" and "plan" for compatibility ──────────
    const body = await req.json();
    console.log("[stripe-checkout] received body keys:", Object.keys(body ?? {}));

    const tier: string | undefined = body?.tier ?? body?.plan;
    console.log("[stripe-checkout] resolved tier:", tier);

    if (tier !== "pro" && tier !== "vip") {
      console.error("[stripe-checkout] invalid tier value:", tier, "| raw body:", JSON.stringify(body));
      return new Response(
        JSON.stringify({
          error: `Invalid tier. Must be 'pro' or 'vip'. Received: ${JSON.stringify(tier)}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const priceId = tier === "pro" ? proPriceId : vipPriceId;
    const origin = body?.origin ?? req.headers.get("origin") ?? "https://localhost:3000";

    console.log("[stripe-checkout] creating session:", {
      tier,
      priceId,
      userId,
      origin,
      successUrl: `${origin}/pricing?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancelled`,
    });

    // ── Stripe Checkout Session ───────────────────────────────────────────────
    const checkoutRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${stripeSecretKey}`,
      },
      body: new URLSearchParams({
        mode: "subscription",
        "payment_method_types[0]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: `${origin}/pricing?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancelled`,
        client_reference_id: userId,
        "metadata[user_id]": userId,
        "metadata[tier]": tier,
        ...(userEmail ? { customer_email: userEmail } : {}),
      }),
    });

    if (!checkoutRes.ok) {
      const errJson = await checkoutRes.json().catch(() => null);
      const stripeErr = errJson?.error ?? {};
      console.error("[stripe-checkout] Stripe API error:", {
        status: checkoutRes.status,
        message: stripeErr.message,
        type: stripeErr.type,
        code: stripeErr.code,
        param: stripeErr.param,
        full: JSON.stringify(errJson),
      });
      return new Response(
        JSON.stringify({
          error: stripeErr.message ?? `Stripe error ${checkoutRes.status}`,
          stripe_type: stripeErr.type ?? null,
          stripe_code: stripeErr.code ?? null,
          stripe_param: stripeErr.param ?? null,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const session = await checkoutRes.json();
    console.log("[stripe-checkout] session created:", session.id);
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[stripe-checkout] unhandled exception:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
