import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── AGMarket (data.gov.in) Fetcher ────────────────────────────────────────────
async function fetchAgmarknetData(crop: string, state: string): Promise<any[] | null> {
  const API_KEY = Deno.env.get("AGMARKNET_API_KEY");
  if (!API_KEY) {
    console.warn("[AGM] AGMARKNET_API_KEY not set — skipping real data fetch");
    return null;
  }

  const BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

  const tryFetch = async (withState: boolean): Promise<any[] | null> => {
    try {
      const url = new URL(BASE_URL);
      url.searchParams.set("api-key", API_KEY);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "50");
      url.searchParams.set("filters[commodity]", crop);
      if (withState && state) url.searchParams.set("filters[state]", state);

      console.log(`[AGM] Fetching: ${crop}${withState ? ` in ${state}` : " (all India)"}`);
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) {
        console.error(`[AGM] HTTP ${res.status}:`, await res.text().catch(() => ""));
        return null;
      }
      const data = await res.json();
      const records: any[] = data.records ?? [];
      console.log(`[AGM] Got ${records.length} records`);
      return records;
    } catch (e) {
      console.error("[AGM] Fetch error:", e);
      return null;
    }
  };

  // Try with state filter first; fall back to all-India if empty
  const withState = await tryFetch(true);
  if (withState && withState.length > 0) return withState;
  return await tryFetch(false);
}

// ── OpenWeatherMap Fetcher ────────────────────────────────────────────────────
async function fetchWeatherData(
  location: string,
  lat?: number,
  lon?: number
): Promise<Record<string, any> | null> {
  const OWM_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");
  if (!OWM_KEY) return null;

  try {
    const coord = lat && lon ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(location + ",IN")}`;
    const [forecastRes, currentRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${coord}&appid=${OWM_KEY}&units=metric&cnt=24`, {
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`https://api.openweathermap.org/data/2.5/weather?${coord}&appid=${OWM_KEY}&units=metric`, {
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    if (!forecastRes.ok || !currentRes.ok) return null;
    const forecast = await forecastRes.json();
    const current = await currentRes.json();
    const items: any[] = forecast.list ?? [];

    let totalRain = 0, avgTemp = 0;
    for (const item of items) {
      totalRain += item.rain?.["3h"] ?? 0;
      avgTemp += item.main.temp;
    }
    if (items.length) avgTemp /= items.length;

    return {
      current_temp: current.main.temp,
      current_humidity: current.main.humidity,
      current_description: current.weather?.[0]?.description ?? "N/A",
      forecast_avg_temp: Math.round(avgTemp * 10) / 10,
      total_rainfall_mm: Math.round(totalRain * 10) / 10,
    };
  } catch (e) {
    console.warn("[OWM] Weather fetch failed:", e);
    return null;
  }
}

// ── Groq AI Call with retry ───────────────────────────────────────────────────
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
          temperature: 0.25,
          max_tokens: 3500,
          response_format: { type: "json_object" },
        }),
      });

      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1000;
        console.warn(`[GROQ] Rate limited — waiting ${wait}ms before retry ${attempt + 1}`);
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
    const { crop, location, lat, lon } = body;

    if (!crop || !location) {
      return new Response(
        JSON.stringify({ error: "crop and location are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const locationParts = location.split(",").map((s: string) => s.trim());
    const state = locationParts.length > 1 ? locationParts[locationParts.length - 1] : "";

    // Parallel data fetch: AGMarket + Weather
    const [agmarknetRecords, weatherData] = await Promise.all([
      fetchAgmarknetData(crop, state),
      fetchWeatherData(location, lat, lon),
    ]);

    // Build AGMarket context for Groq
    let agmarknetContext = "";
    const hasRealData = agmarknetRecords && agmarknetRecords.length > 0;

    if (hasRealData) {
      const rows = agmarknetRecords!.slice(0, 20).map((r: any) =>
        `Market: ${r.market || "N/A"}, District: ${r.district || "N/A"}, State: ${r.state || "N/A"}, ` +
        `Min: ₹${r.min_price}/q, Max: ₹${r.max_price}/q, Modal: ₹${r.modal_price}/q, ` +
        `Variety: ${r.variety || "N/A"}, Date: ${r.arrival_date || "recent"}`
      ).join("\n");
      agmarknetContext = `\n\nREAL AGMARKNET GOVERNMENT DATA (data.gov.in — verified APMC records):\n${rows}\n\n` +
        `IMPORTANT: Convert quintal prices to kg by dividing by 100. Use this as the PRIMARY source for current prices, market comparisons, and trend analysis.`;
    } else {
      agmarknetContext = "\n\nNote: Live Agmarknet data unavailable. Estimate prices based on your knowledge of current Indian mandi prices for this crop and season.";
    }

    const weatherContext = weatherData
      ? `\nCurrent weather at ${location}: ${weatherData.current_temp}°C, humidity ${weatherData.current_humidity}%, ${weatherData.current_description}. ` +
        `3-day forecast avg: ${weatherData.forecast_avg_temp}°C, expected rainfall: ${weatherData.total_rainfall_mm}mm.`
      : "";

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const systemPrompt = `You are an expert Indian agricultural market analyst with deep knowledge of APMC mandi prices, seasonal trends, and farmer economics. Today is ${dateStr}. Always respond with valid JSON only — no markdown, no explanations outside JSON.`;

    const userPrompt = `Provide a detailed crop price forecast for "${crop}" in "${location}", India.
${agmarknetContext}
${weatherContext}

Generate a complete price analysis in this exact JSON schema:
{
  "crop_name": "${crop}",
  "location": "${location}",
  "current_price": {
    "price_per_kg": <number: modal mandi price ÷ 100>,
    "yesterday_price": <estimate slightly different>,
    "trend_percentage": <number, positive=up, negative=down>,
    "unit": "₹/kg"
  },
  "nearby_markets": [
    {"name": "<APMC market>", "price_per_kg": <number>, "distance_km": <estimate>},
    {"name": "<market2>", "price_per_kg": <number>, "distance_km": <number>},
    {"name": "<market3>", "price_per_kg": <number>, "distance_km": <number>}
  ],
  "best_dealers": [
    {
      "name": "<dealer>",
      "type": "<Retail Chain|Commission Agent|Online Retail|FPO / Cooperative>",
      "expected_price_per_kg": <number>,
      "payment_terms": "<days>",
      "minimum_qty_kg": <number>,
      "contact_method": "<how to reach>",
      "pros": ["<pro1>", "<pro2>"],
      "cons": ["<con1>"]
    }
  ],
  "sell_to_recommendation": {
    "best_option": "<best dealer name>",
    "reason": "<clear reason for farmer>",
    "expected_extra_earnings_percent": <number>
  },
  "demand_forecast": {
    "level": "<HIGH|MEDIUM|LOW>",
    "confidence_percent": <60-95>,
    "duration": "Next 7 days",
    "reasons": ["<reason1>", "<reason2>", "<reason3>"]
  },
  "weather_impact": {
    "current_weather": "${weatherData?.current_description ?? "N/A"}",
    "current_temp": "${weatherData?.current_temp ?? "N/A"}°C",
    "forecast_summary": "<forecast>",
    "rainfall_mm": ${weatherData?.total_rainfall_mm ?? 0},
    "impact_statement": "<how weather affects price>"
  },
  "price_prediction": {
    "expected_min": <number>,
    "expected_max": <number>,
    "timeline": "<e.g. Next 15 days>",
    "trend": "<Rising|Falling|Stable>",
    "trend_percentage": "<e.g. +12%>"
  },
  "negotiation_guide": {
    "dont_sell_below": <number>,
    "dont_sell_below_reason": "<why>",
    "fair_price_min": <number>,
    "fair_price_max": <number>,
    "fair_price_advice": "<quote to dealers>",
    "best_case": <number>,
    "best_case_condition": "<when achievable>"
  },
  "recommendation": {
    "action": "<WAIT|SELL NOW>",
    "wait_days": <number or 0>,
    "explanation": "<detailed advice for farmer>",
    "best_selling_window": "<specific dates/period>"
  },
  "negotiation_tips": ["<tip1>", "<tip2>", "<tip3>", "<tip4>"],
  "agmarknet_source": ${hasRealData},
  "data_freshness": "${dateStr}",
  "disclaimer": "Prices based on ${hasRealData ? "real Agmarknet government APMC data" : "AI market knowledge"}. Always verify with your local mandi before selling."
}`;

    const content = await callGroq(systemPrompt, userPrompt);

    let forecastData: any;
    try {
      // Try direct parse first (response_format: json_object guarantees clean JSON)
      forecastData = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No valid JSON in Groq response");
      forecastData = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify(forecastData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[PriceForecast] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
