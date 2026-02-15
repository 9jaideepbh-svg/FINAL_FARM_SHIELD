import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchAgmarknetData(crop: string, state: string) {
  const AGMARKNET_API_KEY = Deno.env.get("AGMARKNET_API_KEY");
  if (!AGMARKNET_API_KEY) {
    console.warn("AGMARKNET_API_KEY not configured");
    return null;
  }

  try {
    // Fetch recent commodity prices from data.gov.in Agmarknet API
    const url = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
    url.searchParams.set("api-key", AGMARKNET_API_KEY);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "50");
    url.searchParams.set("filters[commodity]", crop);
    if (state) {
      url.searchParams.set("filters[state]", state);
    }

    console.log("Fetching Agmarknet data for:", crop, state);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Agmarknet API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const records = data.records || [];
    console.log(`Agmarknet returned ${records.length} records`);

    if (records.length === 0) {
      // Try without state filter
      url.searchParams.delete("filters[state]");
      const res2 = await fetch(url.toString());
      if (res2.ok) {
        const data2 = await res2.json();
        return data2.records || [];
      }
      return [];
    }
    return records;
  } catch (e) {
    console.error("Agmarknet fetch error:", e);
    return null;
  }
}

async function fetchWeatherData(location: string, lat?: number, lon?: number) {
  const OPENWEATHERMAP_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");
  if (!OPENWEATHERMAP_API_KEY) return null;

  try {
    const weatherUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&cnt=24`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)},IN&appid=${OPENWEATHERMAP_API_KEY}&units=metric&cnt=24`;

    const currentUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)},IN&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;

    const [forecastRes, currentRes] = await Promise.all([fetch(weatherUrl), fetch(currentUrl)]);

    if (forecastRes.ok && currentRes.ok) {
      const forecast = await forecastRes.json();
      const current = await currentRes.json();

      let totalRainfall = 0, avgTemp = 0;
      const items = forecast.list || [];
      for (const item of items) {
        totalRainfall += (item.rain?.["3h"] || 0);
        avgTemp += item.main.temp;
      }
      avgTemp = items.length ? avgTemp / items.length : 0;

      return {
        current_temp: current.main.temp,
        current_humidity: current.main.humidity,
        current_description: current.weather?.[0]?.description || "N/A",
        forecast_avg_temp: Math.round(avgTemp * 10) / 10,
        total_rainfall_mm: Math.round(totalRainfall * 10) / 10,
      };
    }
  } catch (e) {
    console.error("Weather fetch failed:", e);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop, location, lat, lon } = await req.json();

    if (!crop || !location) {
      return new Response(
        JSON.stringify({ error: "Crop and location are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract state from location (e.g. "Pune, Maharashtra" -> "Maharashtra")
    const locationParts = location.split(",").map((s: string) => s.trim());
    const state = locationParts.length > 1 ? locationParts[locationParts.length - 1] : "";

    // Fetch data in parallel
    const [agmarknetRecords, weatherData] = await Promise.all([
      fetchAgmarknetData(crop, state),
      fetchWeatherData(location, lat, lon),
    ]);

    // Format Agmarknet data for the AI prompt
    let agmarknetContext = "";
    if (agmarknetRecords && agmarknetRecords.length > 0) {
      const summaryRows = agmarknetRecords.slice(0, 20).map((r: any) =>
        `Market: ${r.market}, District: ${r.district}, State: ${r.state}, Min: ₹${r.min_price}, Max: ₹${r.max_price}, Modal: ₹${r.modal_price}, Variety: ${r.variety}, Date: ${r.arrival_date}`
      ).join("\n");
      agmarknetContext = `\n\nREAL AGMARKNET GOVERNMENT DATA (data.gov.in):\n${summaryRows}\n\nIMPORTANT: Use this REAL government mandi data as the primary source for current prices, nearby market comparisons, and trend analysis. These are actual recorded prices from Indian APMCs.`;
    } else {
      agmarknetContext = "\n\nNote: Agmarknet data was unavailable. Estimate based on your knowledge of Indian mandi prices.";
    }

    const weatherContext = weatherData
      ? `\nWeather for ${location}: ${weatherData.current_temp}°C, ${weatherData.current_humidity}% humidity, ${weatherData.current_description}, forecast avg: ${weatherData.forecast_avg_temp}°C, rainfall: ${weatherData.total_rainfall_mm}mm`
      : "";

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const systemPrompt = `You are an expert Indian agricultural market analyst. You have access to REAL government Agmarknet mandi price data. Today is ${dateStr}. Respond with ONLY valid JSON, no extra text.`;

    const userPrompt = `Analyze price forecast for "${crop}" in "${location}", India.
${agmarknetContext}
${weatherContext}

Based on the real data above, provide:
1. Current prices derived from actual Agmarknet records
2. Nearby markets with real APMC prices
3. Best dealers/buyers who give good margins to farmers
4. Demand analysis considering season, weather, festivals

Respond with this exact JSON:
{
  "crop_name": "${crop}",
  "location": "${location}",
  "current_price": {
    "price_per_kg": <from Agmarknet modal_price, convert quintal to kg by dividing by 100>,
    "yesterday_price": <estimate>,
    "trend_percentage": <number>,
    "unit": "₹/kg"
  },
  "nearby_markets": [
    {"name": "<APMC market from data>", "price_per_kg": <real price/100>, "distance_km": <est>},
    {"name": "<market2>", "price_per_kg": <number>, "distance_km": <number>},
    {"name": "<market3>", "price_per_kg": <number>, "distance_km": <number>}
  ],
  "best_dealers": [
    {
      "name": "Reliance Fresh / JioMart Fresh",
      "type": "Retail Chain",
      "expected_price_per_kg": <number, typically 10-20% above mandi>,
      "payment_terms": "7-15 days",
      "minimum_qty_kg": 500,
      "contact_method": "Visit nearest Reliance Fresh procurement center",
      "pros": ["Reliable payment", "Large volume"],
      "cons": ["Strict quality standards", "Delayed payment"]
    },
    {
      "name": "<Local APMC commission agent>",
      "type": "Commission Agent (Aadtiya)",
      "expected_price_per_kg": <mandi modal price/100>,
      "payment_terms": "Same day / 1-2 days",
      "minimum_qty_kg": 100,
      "contact_method": "Visit ${location} APMC yard",
      "pros": ["Quick payment", "No transport needed"],
      "cons": ["Commission 2-6%", "Price fluctuation"]
    },
    {
      "name": "BigBasket / BB Daily",
      "type": "Online Retail",
      "expected_price_per_kg": <number>,
      "payment_terms": "7-10 days",
      "minimum_qty_kg": 200,
      "contact_method": "Register on BigBasket farmer portal",
      "pros": ["Premium prices", "Regular orders"],
      "cons": ["Quality grading required"]
    },
    {
      "name": "<Regional dealer or FPO>",
      "type": "FPO / Cooperative",
      "expected_price_per_kg": <number>,
      "payment_terms": "3-7 days",
      "minimum_qty_kg": 50,
      "contact_method": "Contact local FPO",
      "pros": ["Fair price", "Collective bargaining"],
      "cons": ["Limited in some areas"]
    }
  ],
  "sell_to_recommendation": {
    "best_option": "<dealer name>",
    "reason": "<why this is best for the farmer>",
    "expected_extra_earnings_percent": <number>
  },
  "demand_forecast": {
    "level": "HIGH" | "MEDIUM" | "LOW",
    "confidence_percent": <60-95>,
    "duration": "Next 7 days",
    "reasons": ["<reason1>", "<reason2>", "<reason3>"]
  },
  "weather_impact": {
    "current_weather": "${weatherData?.current_description || 'N/A'}",
    "current_temp": "${weatherData?.current_temp || 'N/A'}°C",
    "forecast_summary": "<summary>",
    "rainfall_mm": ${weatherData?.total_rainfall_mm || 0},
    "impact_statement": "<impact>"
  },
  "price_prediction": {
    "expected_min": <number>,
    "expected_max": <number>,
    "timeline": "<e.g. By Feb 20>",
    "trend": "Rising" | "Falling" | "Stable",
    "trend_percentage": "<e.g. +15%>"
  },
  "negotiation_guide": {
    "dont_sell_below": <number>,
    "dont_sell_below_reason": "<why>",
    "fair_price_min": <number>,
    "fair_price_max": <number>,
    "fair_price_advice": "Quote this to dealers",
    "best_case": <number>,
    "best_case_condition": "<when achievable>"
  },
  "recommendation": {
    "action": "WAIT" | "SELL NOW",
    "wait_days": <number or 0>,
    "explanation": "<detailed>",
    "best_selling_window": "<dates>"
  },
  "negotiation_tips": ["<tip1>", "<tip2>", "<tip3>"],
  "agmarknet_source": ${agmarknetRecords && agmarknetRecords.length > 0 ? "true" : "false"},
  "data_freshness": "${dateStr}",
  "disclaimer": "Prices based on Agmarknet government data & AI analysis. Verify with local mandi before selling."
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
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get price forecast" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) throw new Error("No response from AI");

    let forecastData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      forecastData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content.substring(0, 500));
      throw new Error("Failed to parse price forecast");
    }

    return new Response(JSON.stringify(forecastData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Price forecast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
