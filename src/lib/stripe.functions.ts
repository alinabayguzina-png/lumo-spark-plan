import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const CheckoutInput = z.object({
  plan: z.enum(["pro", "vip"]),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY!;

    const request = getRequest();
    const authHeader = request?.headers.get("authorization") ?? "";

    const functionUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;

    const res = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        apikey: anonKey,
      },
      body: JSON.stringify({
        plan: data.plan,
        origin: request?.headers.get("origin") ?? "http://localhost:3000",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Checkout failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const result = await res.json();
    if (!result.url) {
      throw new Error("No checkout URL returned from Stripe.");
    }

    return { url: result.url as string };
  });
