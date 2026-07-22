/**
 * Farmer Blog API - Direct client-side implementation
 * Replaces Supabase Edge Function
 * Calls Groq directly from the browser
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function callGroq(systemPrompt: string, userPrompt: string, maxRetries = 2): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
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

export async function fetchFarmerBlogData(category: string): Promise<any> {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const monthYear = today.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const season = (() => {
    const m = today.getMonth() + 1;
    if (m >= 6 && m <= 9) return "Kharif (Monsoon) Season";
    if (m >= 10 && m <= 11) return "Rabi Sowing Season";
    if (m >= 12 || m <= 2) return "Rabi (Winter) Season";
    return "Zaid (Summer) Season";
  })();

  const categoryFilter =
    category && category !== "all" ? `Focus primarily on the "${category}" category.` : "Cover a balanced mix of all categories.";

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
  "headline": "Today's Agriculture Headlines",
  "articles": [
    {
      "id": "article-slug",
      "title": "Article Title",
      "summary": "2-3 sentence summary",
      "content": "Full article content here",
      "category": "innovation",
      "source": "ICAR",
      "region": "All India",
      "image_emoji": "📰",
      "published_time": "1 hour ago",
      "tags": ["tag1", "tag2"],
      "is_breaking": false,
      "impact_level": "HIGH"
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

  return blogData;
}
