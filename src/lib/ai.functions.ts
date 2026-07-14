import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
- Bias toward Reels, TikToks, Shorts, carousels and photo posts that historically drive reach. Only use plain text posts on LinkedIn/X when it clearly fits.
- Every post must include a scroll-stopping hook, a specific visual/video concept the brand can actually shoot, an on-brand caption, 5-10 relevant hashtags, and a clear call to action.
- Vary content pillars across the month: education, entertainment, social proof, behind-the-scenes, product, community.
- Assign each post a date in ${month} (YYYY-MM-DD) and a suggested posting time.

Respond with a JSON object of the exact shape:
{
  "theme": "one-line theme for the month",
  "pillars": ["pillar 1", "pillar 2", "..."],
  "posts": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "time": "18:00",
      "platform": "Instagram|TikTok|LinkedIn|X|YouTube Shorts",
      "format": "Reel|Carousel|Photo|Story|Short|Text",
      "pillar": "education",
      "hook": "the first 2 seconds — text on screen or opening line",
      "concept": "step-by-step visual/video concept the creator can shoot",
      "caption": "final caption",
      "hashtags": ["#a", "#b"],
      "cta": "explicit call to action"
    }
  ]
}

Return ONLY the JSON. No markdown fences, no commentary.`;
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

    const userPlan = profile?.plan ?? "free";
    if (userPlan === "free") {
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
    }

    const { data: biz, error: bizErr } = await sb
      .from("business_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (bizErr) throw new Error(bizErr.message);
    if (!biz) throw new Error("Add your business info before generating a plan.");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Set GEMINI_API_KEY.");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildPrompt(biz, data.month, data.postsPerWeek, data.extraNotes),
                },
              ],
            },
          ],
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
      throw new Error(`AI request failed: ${res.status} ${t.slice(0, 200)}`);
    }

    const json = await res.json();
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