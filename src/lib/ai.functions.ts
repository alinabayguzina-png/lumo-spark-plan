import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  HIDDEN_MONTHLY_CAP,
  GENERIC_LIMIT_ERROR,
  normalizeTier,
} from "./plan-limits";

const GenerateInput = z.object({
  postsPerWeek: z.number().int().min(1).max(21).default(4),
  month: z.string().min(1).max(40),
  extraNotes: z.string().max(2000).optional(),
});

const SYSTEM = `You are Luzo AI, a senior social media strategist for growing brands.
You design monthly content plans that maximize reach and community growth on Instagram, TikTok, LinkedIn, X and YouTube Shorts.
You think in HOOKS, PATTERNS and FORMATS that are proven to increase brand popularity: reactive trends, POV videos, behind-the-scenes, founder POVs, transformations, listicles, memes tailored to the niche, UGC prompts, and educational carousels.
Every post idea is specific to the brand — never generic. Prefer Reels, Shorts, TikToks and photo posts over plain text.
You always respond with STRICT JSON that matches the requested schema. No prose outside JSON.`;

function buildPrompt(biz: {
  business_name: string;
  industry: string | null;
  description: string | null;
  target_audience: string | null;
  brand_tone: string | null;
  goals: string | null;
  platforms: string[];
  website: string | null;
}, month: string, postsPerWeek: number, extra?: string) {
  const total = postsPerWeek * 4;
  const platforms = biz.platforms.length ? biz.platforms.join(", ") : "Instagram, TikTok, LinkedIn";
  return `Design a monthly social content plan for ${month}.

Brand: ${biz.business_name}
Industry: ${biz.industry ?? "n/a"}
What they do: ${biz.description ?? "n/a"}
Audience: ${biz.target_audience ?? "n/a"}
Brand tone: ${biz.brand_tone ?? "n/a"}
Business goals: ${biz.goals ?? "n/a"}
Website: ${biz.website ?? "n/a"}
Active platforms: ${platforms}
${extra ? `Extra notes: ${extra}` : ""}

Requirements:
- Generate exactly ${total} posts (about ${postsPerWeek} per week for 4 weeks).
- Distribute across the active platforms above.
- Bias toward Reels, TikToks, Shorts, carousels and photo posts that drive reach. Use plain text only on LinkedIn/X when it clearly fits.
- Each post: one scroll-stopping hook, one short shootable concept, a tight caption, 5-8 hashtags, one CTA. Keep every field to one line. No filler.
- Vary pillars: education, entertainment, social proof, behind-the-scenes, product, community.
- Assign each post a date in ${month} (YYYY-MM-DD) and a posting time.

Respond with a JSON object of the exact shape:
{
  "theme": "one-line theme for the month",
  "pillars": ["pillar 1", "pillar 2"],
  "posts": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "time": "18:00",
      "platform": "Instagram|TikTok|LinkedIn|X|YouTube Shorts",
      "format": "Reel|Carousel|Photo|Story|Short|Text",
      "pillar": "education",
      "hook": "opening line — short",
      "concept": "one line: what to shoot",
      "caption": "short caption",
      "hashtags": ["#a", "#b"],
      "cta": "one call to action"
    }
  ]
}

Return ONLY the JSON. No markdown fences, no commentary.`;
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

async function callGemini(system: string, prompt: string) {
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

    return res.json();
  }

  const primary = await tryModel(PRIMARY_MODEL, true);
  if (primary) return primary;

  const fallback = await tryModel(FALLBACK_MODEL, false);
  return fallback;
}

export const generateContentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase: sb, userId } = context;

    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr) throw new Error(profileErr.message);

    const tier = normalizeTier(profile?.plan ?? "free");
    if (tier === "free") {
      const { count, error: countErr } = await sb
        .from("content_plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (countErr) throw new Error(countErr.message);
      if ((count ?? 0) >= 1) {
        throw new Error(
          "Free plan is limited to 1 content plan. Upgrade to Pro for unlimited generations.",
        );
      }
    } else {
      const cap = HIDDEN_MONTHLY_CAP[tier];
      if (cap !== null) {
        const { count, error: countErr } = await sb
          .from("content_plans")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        if (countErr) throw new Error(countErr.message);
        if ((count ?? 0) >= cap) {
          throw new Error(GENERIC_LIMIT_ERROR);
        }
      }
    }

    const { data: biz, error: bizErr } = await sb
      .from("business_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (bizErr) throw new Error(bizErr.message);
    if (!biz) throw new Error("Add your business info before generating a plan.");

    const json = await callGemini(
      SYSTEM,
      buildPrompt(biz, data.month, data.postsPerWeek, data.extraNotes),
    );
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned an unreadable response. Try again.");
      parsed = JSON.parse(m[0]);
    }

    const plan = parsed as {
      theme?: string;
      pillars?: string[];
      posts?: Array<Record<string, unknown>>;
    };

    const posts = Array.isArray(plan.posts) ? plan.posts : [];

    const title = `${biz.business_name} — ${data.month}`;
    const { data: saved, error: saveErr } = await sb
      .from("content_plans")
      .insert({
        user_id: userId,
        title,
        month: data.month,
        business_snapshot: {
          business_name: biz.business_name,
          industry: biz.industry,
          target_audience: biz.target_audience,
          brand_tone: biz.brand_tone,
          platforms: biz.platforms,
        },
        posts: JSON.parse(
          JSON.stringify({ theme: plan.theme ?? "", pillars: plan.pillars ?? [], items: posts }),
        ),
      })
      .select("id")
      .single();
    if (saveErr) throw new Error(saveErr.message);

    return { id: saved.id };
  });