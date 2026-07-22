import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",").map((p) => p.trim());
  let timestamp = "";
  let v1Signature = "";
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = v;
    if (k === "v1") v1Signature = v;
  }
  if (!timestamp || !v1Signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedHex === v1Signature;
}

function priceToPlan(priceId: string | undefined, proPriceId: string, vipPriceId: string): string {
  if (priceId === proPriceId) return "pro";
  if (priceId === vipPriceId) return "vip";
  return "free";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID") ?? "price_1TvnN1DE7Dg6n9MX8u8Gk9qC";
    const vipPriceId = Deno.env.get("STRIPE_VIP_PRICE_ID") ?? "price_1TvnO3DE7Dg6n9MXr4X28qeB";

    if (!stripeSecretKey || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Stripe webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawBody = await req.text();
    const sigHeader = req.headers.get("Stripe-Signature") ?? "";

    const valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const event = JSON.parse(rawBody);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "No client_reference_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Fetch the subscription to get price and period end
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });
      const subscription = await subRes.json();
      const priceId = subscription?.items?.data?.[0]?.price?.id;
      const plan = priceToPlan(priceId, proPriceId, vipPriceId);
      const currentPeriodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const { error: upsertErr } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan,
            status: subscription?.status ?? "active",
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" },
        );
      if (upsertErr) throw new Error(upsertErr.message);

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ plan, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (profileErr) throw new Error(profileErr.message);
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;
      const stripeSubscriptionId = subscription.id;
      const priceId = subscription?.items?.data?.[0]?.price?.id;
      const plan = priceToPlan(priceId, proPriceId, vipPriceId);
      const currentPeriodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const { data: existing, error: lookupErr } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", stripeSubscriptionId)
        .maybeSingle();
      if (lookupErr) throw new Error(lookupErr.message);

      const userId = existing?.user_id ?? subscription.metadata?.user_id;
      if (!userId) {
        return new Response(
          JSON.stringify({ received: true, note: "No user_id found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: upsertErr } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan,
            status: subscription.status,
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" },
        );
      if (upsertErr) throw new Error(upsertErr.message);

      const newPlan = subscription.status === "active" || subscription.status === "trialing" ? plan : "free";
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (profileErr) throw new Error(profileErr.message);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const stripeSubscriptionId = subscription.id;

      const { data: existing, error: lookupErr } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", stripeSubscriptionId)
        .maybeSingle();
      if (lookupErr) throw new Error(lookupErr.message);

      const userId = existing?.user_id ?? subscription.metadata?.user_id;
      if (!userId) {
        return new Response(
          JSON.stringify({ received: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: updateSubErr } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", plan: "free" })
        .eq("user_id", userId);
      if (updateSubErr) throw new Error(updateSubErr.message);

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ plan: "free", updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (profileErr) throw new Error(profileErr.message);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
