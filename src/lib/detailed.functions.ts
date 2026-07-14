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
Your job is to turn a single post idea into a clear, shot-ready execution plan the creator can pick up and film today.
Be concise and easy to skim. Prefer short, punchy sentences over paragraphs. Keep every field tight — no filler, no fluff.
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
- Break the video into 3–5 scenes covering the full duration. Timestamps must be non-overlapping and cover 0s to ~${length}s.
- The first scene is a scroll-stopping hook (first 1.5s). Include a brief "why it works" note.
- End with a payoff + a natural CTA.
- Keep each scene SHORT and skimmable: one sentence per field. No paragraphs.
- Add a caption, 5–8 hashtags, viral tips and a posting tip.

Respond with a JSON object of the exact shape:
{
  "kind": "video",
  "summary": "one-line pitch of the finished video",
  "totalDurationSec": ${length},
  "hookAnalysis": "one short sentence — why the opening stops the scroll",
  "scenes": [
    {
      "range": "0–2 sec",
      "startSec": 0,
      "endSec": 2,
      "script": "exact words to say — one short line",
      "onScreenText": "text on screen — a few words",
      "visual": "one line: what the viewer sees",
      "cameraShot": "e.g. handheld close-up",
      "editingMove": "e.g. hard cut, zoom punch, whip pan",
      "retentionTip": "one short line — why it keeps them watching"
    }
  ],
  "musicDirection": "one line: vibe + tempo",
  "editingStyle": "one line: pacing + transitions",
  "caption": "final caption — 1–3 short lines",
  "hashtags": ["#a", "#b"],
  "cta": "final call to action",
  "viralTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "retentionTactics": ["curiosity gap", "reveal", "loop", "pattern interrupt"],
  "postingTip": "best posting time + first-comment strategy — one line"
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
- Slide 1 is the cover hook. Include a short "why it earns the tap" line.
- Slides 2 → ${count - 1} deliver the payoff (problem → solution, or list-of-N, or before/after).
- Slide ${count} is the CTA slide.
- Keep each slide SHORT and skimmable: one sentence per field.
- Return a final caption + viral tips.

Respond with a JSON object of the exact shape:
{
  "kind": "slides",
  "summary": "one-line pitch",
  "coverStrategy": "one short sentence — why slide 1 earns the tap",
  "slides": [
    {
      "index": 1,
      "role": "cover | value | proof | cta",
      "photoDirection": "one line: what the photo shows",
      "onSlideText": "exact text — keep it short",
      "layout": "one line: e.g. text-top, full-bleed photo",
      "colorMood": "one line: palette + vibe"
    }
  ],
  "caption": "final caption — 1–3 short lines",
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
  "hookAnalysis": "one short sentence — why the hook works",
  "visualDirection": "one line: what the image should look like",
  "onScreenText": "text overlay if any — short",
  "caption": "final caption — 1–3 short lines",
  "hashtags": ["#a", "#b"],
  "cta": "final call to action",
  "viralTips": ["tip 1", "tip 2", "tip 3"],
  "postingTip": "one line: best posting time + first-comment strategy"
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

const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

function isUnavailableError(status: number, text: string) {
  if (status === 503) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("temporarily overloaded") ||
    lower.includes("overloaded") ||
    lower.includes("capacity")
  );
}

async function callAi(system: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI is not configured. Set GEMINI_API_KEY.");

  async function tryModel(model: string, allowFallback: boolean) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (res.status === 429) {
      const errorText = await res.text();
      throw new Error(`Gemini API 429: ${errorText}`);
    }
    if (!res.ok) {
      const t = await res.text();
      if (allowFallback && isUnavailableError(res.status, t)) {
        return null;
      }
      throw new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    try {
      return JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned an unreadable response. Try again.");
      return JSON.parse(m[0]);
    }
  }

  const primary = await tryModel(PRIMARY_MODEL, true);
  if (primary) return primary;

  return tryModel(FALLBACK_MODEL, false);
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
      throw new Error("Free plan includes 1 Execution Plan. Upgrade to Pro for 15/month or VIP for unlimited.");
    }
    if (tier === "pro") {
      throw new Error("Pro plan is limited to 15 Execution Plans. Upgrade to VIP for unlimited.");
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