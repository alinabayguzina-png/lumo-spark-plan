import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Favorite = {
  id: string;
  plan_id: string;
  post_index: number;
  post_snapshot: Record<string, unknown>;
  plan_title: string | null;
  created_at: string;
};

export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("id, plan_id, post_index, post_snapshot, plan_title, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Favorite[];
  });

export const listFavoriteKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("plan_id, post_index")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const keys = new Set<string>();
    for (const row of data ?? []) {
      keys.add(`${row.plan_id}:${row.post_index}`);
    }
    return [...keys];
  });

const ToggleInput = z.object({
  planId: z.string().uuid(),
  postIndex: z.number().int().min(0),
  postSnapshot: z.record(z.unknown()).optional(),
  planTitle: z.string().optional(),
});

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ToggleInput.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const userId = context.userId;

    const { data: existing } = await sb
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_id", data.planId)
      .eq("post_index", data.postIndex)
      .maybeSingle();

    if (existing) {
      const { error } = await sb
        .from("favorites")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { favorited: false };
    }

    const { error } = await sb.from("favorites").insert({
      user_id: userId,
      plan_id: data.planId,
      post_index: data.postIndex,
      post_snapshot: data.postSnapshot ?? {},
      plan_title: data.planTitle ?? null,
    });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });
