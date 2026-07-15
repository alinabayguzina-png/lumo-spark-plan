import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  postsPerWeek: z.number().int().min(1).max(14).default(4),
  month: z.string().min(1).max(80),
  extraNotes: z.string().max(2000).optional(),
});

const SYSTEM = `You are Luzo AI, a senior social media strategist for growing brands.
You design monthly content plans that maximize reach and community growth on Instagram, TikTok, LinkedIn, X and YouTube Shorts.
You think in HOOKS, PATTERNS and FORMATS that are proven to increase brand popularity: reactive trends, POV videos, behind-the-scenes, founder POVs, transformations, listicles, memes tailored to the niche, UGC prompts, and educational carousels.
Every post idea is specific to the brand — never generic. Prefer Reels, Shorts, TikToks and photo posts over plain text.
You always respond with STRICT JSON that matches the requested schema. No prose outside JSON.`;

function buildPrompt(
  biz: {
    business_name: string;
    industry: string | null;
    description: string | null;
    target_audience: string | null;
    brand_tone: string | null;
    goals: string | null;
    platforms: string[];
    website: string | null;
  },
  month: string,
  postsPerWeek: number,
  extra?: string,
) {
  const total = postsPerWeek * 4;
  const platforms = biz.platforms.length
    ? biz.platforms.join(", ")
    : "Instagram, TikTok, LinkedIn";
  return `Design a monthly social content plan named "${month}".

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
- Assign each post a day number (1..28) and a suggested posting time.

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

async function openGeminiStream(model: string, system: string, prompt: string, apiKey: string) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
}

function sseEncode(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export const Route = createFileRoute("/api/public/generate-plan-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!token) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (userErr || !userData?.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid body", { status: 400 });
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(parsed.error.message, { status: 400 });
        }
        const input = parsed.data;

        // Quota check
        const { data: profile, error: profileErr } = await supabaseAdmin
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
        if (profileErr) return new Response(profileErr.message, { status: 500 });
        const userPlan = profile?.plan ?? "free";
        if (userPlan === "free") {
          const { count, error: cErr } = await supabaseAdmin
            .from("content_plans")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          if (cErr) return new Response(cErr.message, { status: 500 });
          if ((count ?? 0) >= 1) {
            return new Response(
              "Free plan is limited to 1 content plan. Upgrade to Pro for unlimited generations.",
              { status: 403 },
            );
          }
        }

        const { data: biz, error: bizErr } = await supabaseAdmin
          .from("business_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (bizErr) return new Response(bizErr.message, { status: 500 });
        if (!biz) {
          return new Response("Add your business info before generating a plan.", { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response("AI is not configured. Set GEMINI_API_KEY.", { status: 500 });
        }

        const prompt = buildPrompt(biz, input.month, input.postsPerWeek, input.extraNotes);

        // Try primary, fall back on unavailable
        let upstream = await openGeminiStream(PRIMARY_MODEL, SYSTEM, prompt, apiKey);
        if (!upstream.ok) {
          const errText = await upstream.text();
          if (upstream.status === 429) {
            return new Response(`Gemini API 429: ${errText}`, { status: 429 });
          }
          if (isUnavailableError(upstream.status, errText)) {
            upstream = await openGeminiStream(FALLBACK_MODEL, SYSTEM, prompt, apiKey);
            if (!upstream.ok) {
              const t2 = await upstream.text();
              return new Response(`AI request failed: ${upstream.status} ${t2.slice(0, 200)}`, {
                status: 502,
              });
            }
          } else {
            return new Response(`AI request failed: ${upstream.status} ${errText.slice(0, 200)}`, {
              status: 502,
            });
          }
        }

        const upstreamBody = upstream.body;
        if (!upstreamBody) {
          return new Response("AI returned no stream.", { status: 502 });
        }

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const reader = upstreamBody.getReader();
            let buffer = "";
            let fullText = "";

            const send = (obj: unknown) => controller.enqueue(encoder.encode(sseEncode(obj)));

            try {
              send({ type: "start" });
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                // Parse SSE frames from upstream
                let idx;
                while ((idx = buffer.indexOf("\n\n")) !== -1) {
                  const frame = buffer.slice(0, idx);
                  buffer = buffer.slice(idx + 2);
                  for (const line of frame.split("\n")) {
                    if (!line.startsWith("data:")) continue;
                    const payload = line.slice(5).trim();
                    if (!payload) continue;
                    try {
                      const json = JSON.parse(payload);
                      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                      if (text) {
                        fullText += text;
                        send({ type: "chunk", text });
                      }
                    } catch {
                      // ignore parse errors on partial frames
                    }
                  }
                }
              }

              // Parse final JSON
              let parsedPlan: {
                theme?: string;
                pillars?: string[];
                posts?: Array<Record<string, unknown>>;
              } = {};
              try {
                parsedPlan = JSON.parse(fullText);
              } catch {
                const m = fullText.match(/\{[\s\S]*\}/);
                if (m) {
                  try {
                    parsedPlan = JSON.parse(m[0]);
                  } catch {
                    /* ignore */
                  }
                }
              }
              const posts = Array.isArray(parsedPlan.posts) ? parsedPlan.posts : [];
              const title = `${biz.business_name} — ${input.month}`;

              const { data: saved, error: saveErr } = await supabaseAdmin
                .from("content_plans")
                .insert({
                  user_id: userId,
                  title,
                  month: input.month,
                  business_snapshot: {
                    business_name: biz.business_name,
                    industry: biz.industry,
                    target_audience: biz.target_audience,
                    brand_tone: biz.brand_tone,
                    platforms: biz.platforms,
                  },
                  posts: JSON.parse(
                    JSON.stringify({
                      theme: parsedPlan.theme ?? "",
                      pillars: parsedPlan.pillars ?? [],
                      items: posts,
                    }),
                  ),
                })
                .select("id")
                .single();

              if (saveErr) {
                send({ type: "error", message: saveErr.message });
              } else {
                send({ type: "done", planId: saved.id });
              }
            } catch (err) {
              send({
                type: "error",
                message: err instanceof Error ? err.message : "Stream failed",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});