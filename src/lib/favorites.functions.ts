import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Favorite = {
  id: string;
  content_plan_id: string;
  post_id: string;
  post_data: Record<string, unknown>;
  created_at: string;
};

export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("id, content_plan_id, post_id, post_data, created_at")
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
      .select("content_plan_id, post_id")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const keys = new Set<string>();
    for (const row of data ?? []) {
      keys.add(`${row.content_plan_id}:${row.post_id}`);
    }
    return [...keys];
  });

const ToggleInput = z.object({
  contentPlanId: z.string().uuid(),
  postId: z.string().min(1).max(100),
  postData: z.record(z.unknown()).optional(),
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
      .eq("content_plan_id", data.contentPlanId)
      .eq("post_id", data.postId)
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
      content_plan_id: data.contentPlanId,
      post_id: data.postId,
      post_data: data.postData ?? {},
    });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });
