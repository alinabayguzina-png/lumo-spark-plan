import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  business_name: z.string().trim().min(1).max(120),
  industry: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  target_audience: z.string().trim().max(500).optional().default(""),
  brand_tone: z.string().trim().max(200).optional().default(""),
  goals: z.string().trim().max(1000).optional().default(""),
  platforms: z.array(z.string()).max(10).default([]),
  website: z.string().trim().max(200).optional().default(""),
});

export const getMyBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("business_profiles")
      .upsert(
        { user_id: context.userId, ...data },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });