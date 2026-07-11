import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { DETAILED_LIMIT, canEditDetailed, normalizeTier } from "./plan-limits";

export type DetailedKind = "video" | "slides" | "post";

function detectKind(post: { platform?: string; format?: string }): DetailedKind {
  const fmt = (post.format ?? "").toLowerCase();
  const plat = (post.platform ?? "").toLowerCase();
  if (/reel|short|tiktok|video|vlog/.test(fmt)) return "video";
  if (/carousel|slide/.test(fmt)) return "slides";
  if (plat === "tiktok" && /photo/.test(fmt)) return "slides";
  if (plat === "instagram" && /photo/.test(fmt) && !/reel/.test(fmt)) return "slides";
  return "post";
}

const InputSchema = z.object({
  planId: z.string().uuid(),
  postIndex: z.number().int().min(0),
  videoLengthSec: z.number().int().min(3).max(600).optional(),
  slideCount: z.number().int().min(1).max(20).optional(),
  preferences: z.string().max(2000).optional(),
});

const RegenSchema = InputSchema;

const EditSchema = z.object({
  planId: z.string().uuid(),
  postIndex: z.number().int().min(0),
  content: z.unknown(),
});

const SYSTEM = `You are Luzo AI, a world-class short-form content director for social media.
Your job is to turn a single post idea into a fully-produced, shot-ready execution plan engineered for maximum reach, retention, saves and shares.
You think in HOOKS, PATTERNS INTERRUPTS, RETENTION LOOPS, PAYOFFS, and PLATFORM-NATIVE editing tricks used by the top 1% of creators.
Never write generic content. Every line is specific to this brand and this idea.
You always respond with STRICT JSON that matches the requested schema. No prose outside JSON.`;

function videoPrompt(brand: string, post: PostShape, lengthSec: number | undefined, prefs: string | undefined) {
  const length = lengthSec ?? 30;
  return `Design a viral short-form video for the brand "${brand}".

Source idea:
- Platform: ${post.platform ?? "n/a"}
- Format: ${post.format ?? "Reel"}
- Hook: ${post.hook ?? "n/a"}
- Concept: ${post.concept ?? "n/a"}
- Caption base: ${post.caption ?? "n/a"}
- CTA: ${post.cta ?? "n/a"}

User preferences: ${prefs ?? "none"}
Target length: ~${length} seconds.

Requirements:
- Break the video into 4–7 scenes covering the full duration. Timestamps must be non-overlapping and cover 0s to ~${length}s.
- The FIRST scene is a scroll-stopping hook engineered for the first 1.5s: pattern interrupt visual + on-screen text + spoken hook. Explain WHY it stops the scroll.
- Include a mid-video retention beat (curiosity gap, reveal, or "wait for it") to prevent drop-off around the 40–60% mark.
- End with a satisfying payoff + a natural CTA that doesn't feel salesy.
- Every scene must specify: exact voiceover script, on-screen text, camera angle and shot type, b-roll needed, editing move (cut, zoom punch-in, whip pan, speed ramp, jump cut), sfx/music beat.
- Add music/sfx direction, editing style, viral tips, and 8–12 hashtags optimized for the platform.

Respond with a JSON object of the exact shape:
{
  "kind": "video",
  "summary": "one-line pitch of the finished video",
  "totalDurationSec": ${length},
  "hookAnalysis": "why the opening 1.5s will stop the scroll",
  "scenes": [
    {
      "range": "0–2 sec",
      "startSec": 0,
      "endSec": 2,
      "script": "exact words to say out loud",
      "onScreenText": "text that appears on screen",
      "visual": "what the viewer sees (subject, action, setting)",
      "cameraShot": "e.g. handheld POV close-up, tripod medium, overhead top-down",
      "cameraAngle": "e.g. eye-level, low-angle, dutch",
      "bRoll": ["b-roll clip 1", "b-roll clip 2"],
      "editingMove": "e.g. hard cut, zoom punch, whip pan, freeze frame + text",
      "sfx": "specific sound effect or music beat",
      "retentionTip": "why this scene keeps them watching"
    }
  ],
  "musicDirection": "genre, tempo, energy curve; reference 1–2 trending sound categories",
  "editingStyle": "pacing, cut frequency, transitions, color/grain",
  "caption": "final caption with line breaks, engineered for saves/comments",
  "hashtags": ["#a", "#b"],
  "cta": "final call to action",
  "viralTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "retentionTactics": ["curiosity gap", "reveal", "loop", "pattern interrupt"],
  "postingTip": "best posting time + first-comment strategy"
}

Return ONLY the JSON. No markdown fences.`;
}

function slidesPrompt(brand: string, post: PostShape, slideCount: number | undefined, prefs: string | undefined) {
  const count = slideCount ?? 7;
  return `Design a scroll-stopping ${post.platform ?? "Instagram"} ${post.format ?? "Carousel"} for the brand "${brand}".

Source idea:
- Hook: ${post.hook ?? "n/a"}
- Concept: ${post.concept ?? "n/a"}
- Caption base: ${post.caption ?? "n/a"}
- CTA: ${post.cta ?? "n/a"}

User preferences: ${prefs ?? "none"}
Total slides: exactly ${count}.

Requirements:
- Slide 1 is the cover — a bold hook that promises value or triggers curiosity. Explain why it earns the tap.
- Slides 2 → ${count - 1} deliver the payoff in an engineered order (problem → agitation → solution, or list-of-N, or before/after).
- Slide ${count} is the CTA slide (save, follow, DM, link in bio).
- Every slide includes: the exact image/photo direction, exact on-slide text/typography direction, layout, dominant color/mood.
- Return a final IG-optimized caption designed to trigger comments and saves.

Respond with a JSON object of the exact shape:
{
  "kind": "slides",
  "summary": "one-line pitch",
  "coverStrategy": "why slide 1 earns the tap",
  "slides": [
    {
      "index": 1,
      "role": "cover | value | proof | cta",
      "photoDirection": "exactly what the photo shows (subject, framing, lighting, props)",
      "onSlideText": "exact text on this slide",
      "typography": "font style, size, placement, hierarchy",
      "layout": "e.g. text-top, full-bleed photo with bottom-left overlay",
      "colorMood": "dominant palette and vibe"
    }
  ],
  "caption": "final caption engineered for saves/comments (2–4 short paragraphs)",
  "hashtags": ["#a", "#b"],
  "cta": "final call to action",
  "viralTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "engagementHooks": ["comment-bait line", "save-bait line"]
}

Return ONLY the JSON. No markdown fences.`;
}

function postPrompt(brand: string, post: PostShape, prefs: string | undefined) {
  return `Design a complete execution plan for a single ${post.platform ?? "social"} ${post.format ?? "post"} for the brand "${brand}".

Source idea:
- Hook: ${post.hook ?? "n/a"}
- Concept: ${post.concept ?? "n/a"}
- Caption base: ${post.caption ?? "n/a"}
- CTA: ${post.cta ?? "n/a"}

User preferences: ${prefs ?? "none"}

Respond with a JSON object of the exact shape:
{
  "kind": "post",
  "summary": "one-line pitch",
  "hookAnalysis": "why this hook stops the scroll",
  "visualDirection": "exactly what the image/graphic should look like",
  "onScreenText": "text overlay if any",
  "caption": "final caption engineered for engagement",
  "hashtags": ["#a", "#b"],
  "cta": "final call to action",
  "viralTips": ["tip 1", "tip 2", "tip 3"],
  "postingTip": "best posting time + first-comment strategy"
}

Return ONLY the JSON. No markdown fences.`;
}

type PostShape = {
  platform?: string;
  format?: string;
  hook?: string;
  concept?: string;
  caption?: string;
  cta?: string;
  date?: string;
  time?: string;
};

async function loadContext(
  sb: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  planId: string,
  postIndex: number,
) {
  const { data: plan, error } = await sb
    .from("content_plans")
    .select("id, title, business_snapshot, posts")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!plan) throw new Error("Plan not found.");

  const body = plan.posts as { items?: PostShape[] } | null;
  const post = body?.items?.[postIndex];
  if (!post) throw new Error("Post not found in this plan.");

  const snap = (plan.business_snapshot ?? {}) as { business_name?: string };
  const brand = snap.business_name ?? plan.title ?? "the brand";
  return { plan, post, brand };
}

async function callAi(system: string, prompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("You're going too fast — try again in a minute.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace. Add credits to continue.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI returned an unreadable response. Try again.");
    return JSON.parse(m[0]);
  }
}

async function assertDetailedQuota(
  sb: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
) {
  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) throw new Error(profileErr.message);
  const tier = normalizeTier(profile?.plan ?? "free");
  const limit = DETAILED_LIMIT[tier];
  if (limit === null) return tier;

  const { count, error: cErr } = await sb
    .from("detailed_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (cErr) throw new Error(cErr.message);

  if ((count ?? 0) >= limit) {
    if (tier === "free") {
      throw new Error("Free plan is limited to 1 detailed generation. Upgrade to Pro for 15, or VIP for unlimited.");
    }
    if (tier === "pro") {
      throw new Error("Pro plan is limited to 15 detailed generations. Upgrade to VIP for unlimited.");
    }
  }
  return tier;
}

export const getDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ planId: z.string().uuid(), postIndex: z.number().int().min(0) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("detailed_plans")
      .select("*")
      .eq("plan_id", data.planId)
      .eq("post_index", data.postIndex)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const generateDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const userId = context.userId;

    // If a row already exists for this (plan, post), do not consume a new quota slot.
    const { data: existing } = await sb
      .from("detailed_plans")
      .select("id")
      .eq("plan_id", data.planId)
      .eq("post_index", data.postIndex)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) await assertDetailedQuota(sb, userId);

    const { post, brand } = await loadContext(sb, userId, data.planId, data.postIndex);
    const kind = detectKind(post);

    const prompt =
      kind === "video"
        ? videoPrompt(brand, post, data.videoLengthSec, data.preferences)
        : kind === "slides"
        ? slidesPrompt(brand, post, data.slideCount, data.preferences)
        : postPrompt(brand, post, data.preferences);

    const content = await callAi(SYSTEM, prompt);

    const title = post.hook ?? `${post.platform ?? "Post"} · ${post.format ?? ""}`.trim();
    const inputPayload = {
      videoLengthSec: data.videoLengthSec ?? null,
      slideCount: data.slideCount ?? null,
      preferences: data.preferences ?? "",
    };

    const { data: saved, error: saveErr } = await sb
      .from("detailed_plans")
      .upsert(
        {
          user_id: userId,
          plan_id: data.planId,
          post_index: data.postIndex,
          kind,
          title,
          input: JSON.parse(JSON.stringify(inputPayload)),
          content: JSON.parse(JSON.stringify(content)),
        },
        { onConflict: "plan_id,post_index" },
      )
      .select("*")
      .single();
    if (saveErr) throw new Error(saveErr.message);

    return saved;
  });

export const regenerateDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;

    const { data: profile } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    const tier = normalizeTier(profile?.plan ?? "free");
    if (!canEditDetailed(tier)) {
      throw new Error("Regenerating detailed plans is a VIP feature. Upgrade to VIP to unlock.");
    }

    const { post, brand } = await loadContext(sb, context.userId, data.planId, data.postIndex);
    const kind = detectKind(post);

    const prompt =
      kind === "video"
        ? videoPrompt(brand, post, data.videoLengthSec, data.preferences)
        : kind === "slides"
        ? slidesPrompt(brand, post, data.slideCount, data.preferences)
        : postPrompt(brand, post, data.preferences);

    const content = await callAi(SYSTEM, prompt);
    const inputPayload = {
      videoLengthSec: data.videoLengthSec ?? null,
      slideCount: data.slideCount ?? null,
      preferences: data.preferences ?? "",
    };

    const { data: saved, error } = await sb
      .from("detailed_plans")
      .upsert(
        {
          user_id: context.userId,
          plan_id: data.planId,
          post_index: data.postIndex,
          kind,
          input: JSON.parse(JSON.stringify(inputPayload)),
          content: JSON.parse(JSON.stringify(content)),
        },
        { onConflict: "plan_id,post_index" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const updateDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EditSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;

    const { data: profile } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    const tier = normalizeTier(profile?.plan ?? "free");
    if (!canEditDetailed(tier)) {
      throw new Error("Editing detailed plans is a VIP feature. Upgrade to VIP to unlock.");
    }

    const { error } = await sb
      .from("detailed_plans")
      .update({ content: JSON.parse(JSON.stringify(data.content)) })
      .eq("plan_id", data.planId)
      .eq("post_index", data.postIndex)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });