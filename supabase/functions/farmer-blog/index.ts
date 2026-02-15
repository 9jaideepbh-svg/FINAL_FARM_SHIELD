import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const monthYear = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    const categoryFilter = category && category !== "all" ? `Focus on the "${category}" category.` : "";

    const systemPrompt = `You are an expert Indian agricultural journalist. Today is ${dateStr}. Generate realistic, current agricultural news articles for Indian farmers. Include real government schemes, real agricultural innovations, and believable farmer success stories from different Indian states. Make it feel like a real agricultural newspaper. Respond with ONLY valid JSON.`;

    const userPrompt = `Generate a farmer newspaper edition for ${dateStr}. ${categoryFilter}

Create 8-10 diverse articles across these categories:
- "innovation": Latest agri-tech innovations, new seed varieties, drones, AI in farming
- "scheme": Active government schemes (PM-Kisan, PM-AASHA, Soil Health Card, eNAM, PMFBY etc.)
- "success_story": Inspiring farmer stories from different states with actual earnings
- "market": Market trends, export opportunities, price analysis
- "weather": Seasonal advisories, monsoon updates, climate-smart farming tips
- "organic": Organic farming, natural farming (ZBNF), sustainable practices
- "policy": Agricultural policy updates, MSP announcements, budget allocations

Each article must feel current and relevant to ${monthYear}.

Respond with this JSON:
{
  "edition_date": "${dateStr}",
  "headline": "<Catchy main headline for today's edition>",
  "articles": [
    {
      "id": "<unique-slug>",
      "title": "<Article headline>",
      "summary": "<2-3 line summary>",
      "content": "<Full 150-250 word article with details, quotes, numbers>",
      "category": "<innovation|scheme|success_story|market|weather|organic|policy>",
      "source": "<Believable source like 'ICAR', 'Ministry of Agriculture', 'Krishi Jagran', 'The Hindu BusinessLine'>",
      "region": "<Indian state or 'All India'>",
      "image_emoji": "<relevant emoji>",
      "published_time": "<e.g. 2 hours ago, 5 hours ago>",
      "tags": ["<tag1>", "<tag2>"],
      "is_breaking": <true only for 1 article, false for rest>
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const err = await response.text();
      console.error("AI error:", response.status, err);
      return new Response(JSON.stringify({ error: "Failed to generate blog content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    let blogData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      blogData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Parse error:", e, "Content:", content.substring(0, 500));
      throw new Error("Failed to parse blog content");
    }

    return new Response(JSON.stringify(blogData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Farmer blog error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
