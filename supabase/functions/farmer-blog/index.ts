import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Groq call with retry ───────────────────────────────────────────────────────
async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2
): Promise<string> {
  const GROQ_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not configured on server");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4500,
          response_format: { type: "json_object" },
        }),
      });

      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1200;
        console.warn(`[GROQ] Rate limited — retry ${attempt + 1} after ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Groq HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty Groq response");
      return content;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      console.warn(`[GROQ] Attempt ${attempt + 1} failed:`, e);
    }
  }
  throw new Error("All Groq retries exhausted");
}

// ── Main Handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { category } = body;

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const monthYear = today.toLocaleDateString("en-IN", {
      month: "long", year: "numeric",
    });
    const season = (() => {
      const m = today.getMonth() + 1;
      if (m >= 6 && m <= 9) return "Kharif (Monsoon) Season";
      if (m >= 10 && m <= 11) return "Rabi Sowing Season";
      if (m >= 12 || m <= 2) return "Rabi (Winter) Season";
      return "Zaid (Summer) Season";
    })();

    const categoryFilter =
      category && category !== "all"
        ? `Focus primarily on the "${category}" category.`
        : "Cover a balanced mix of all categories.";

    const systemPrompt =
      `You are an expert Indian agricultural journalist writing for Kisan Times, India's premier farming newspaper. ` +
      `Today is ${dateStr} (${season}). Generate realistic, current agricultural news for Indian farmers. ` +
      `Include real government schemes, actual agricultural innovations, and inspiring farmer success stories. ` +
      `Make the content feel like a real agricultural newspaper published today. ` +
      `Always respond with valid JSON only — no markdown wrappers, no extra text outside JSON.`;

    const userPrompt =
      `Generate today's Kisan Times newspaper edition for ${dateStr}. ${categoryFilter}

Create 8-10 diverse articles across these categories:
- "innovation": Latest agri-tech (drones, AI, IoT, new varieties, precision farming)
- "scheme": Active government schemes (PM-Kisan, PM-AASHA, Soil Health Card, eNAM, PMFBY, RKVY, etc.)
- "success_story": Inspiring farmer success stories with actual income figures
- "market": Mandi trends, export opportunities, MSP updates, price analysis
- "weather": Seasonal advisories for ${season}, monsoon/dry spell impact
- "organic": ZBNF, organic certification, natural farming, sustainable practices
- "policy": Agricultural policy updates, budget allocations, new regulations

Each article must feel current for ${monthYear}.

Respond with this exact JSON structure:
{
  "edition_date": "${dateStr}",
  "season": "${season}",
  "headline": "<Catchy, relevant main headline for today>",
  "articles": [
    {
      "id": "<unique-kebab-case-slug>",
      "title": "<Compelling article headline>",
      "summary": "<2-3 impactful sentences summarizing the article>",
      "content": "<Full 200-280 word article with specific details, real-sounding quotes, actual numbers and percentages, state names, farmer names, and actionable information>",
      "category": "<innovation|scheme|success_story|market|weather|organic|policy>",
      "source": "<Credible source: ICAR, Ministry of Agriculture, Krishi Jagran, The Hindu BusinessLine, KisanSamachar, etc.>",
      "region": "<Specific Indian state or 'All India'>",
      "image_emoji": "<Most relevant single emoji>",
      "published_time": "<e.g. 1 hour ago, 3 hours ago, 5 hours ago, This morning>",
      "tags": ["<tag1>", "<tag2>", "<tag3>"],
      "is_breaking": <true for exactly 1 article, false for all others>,
      "impact_level": "<HIGH|MEDIUM|LOW>"
    }
  ]
}`;

    const content = await callGroq(systemPrompt, userPrompt);

    let blogData: any;
    try {
      blogData = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No valid JSON in Groq response");
      blogData = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify(blogData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[FarmerBlog] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
