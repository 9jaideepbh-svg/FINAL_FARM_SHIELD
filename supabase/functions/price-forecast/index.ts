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
    const { crop, location, lat, lon } = await req.json();

    if (!crop || !location) {
      return new Response(
        JSON.stringify({ error: "Crop and location are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENWEATHERMAP_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Fetch weather data
    let weatherData: any = null;
    if (OPENWEATHERMAP_API_KEY) {
      try {
        const weatherUrl = lat && lon
          ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&cnt=24`
          : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)},IN&appid=${OPENWEATHERMAP_API_KEY}&units=metric&cnt=24`;

        const currentUrl = lat && lon
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
          : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)},IN&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;

        const [forecastRes, currentRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(currentUrl),
        ]);

        if (forecastRes.ok && currentRes.ok) {
          const forecast = await forecastRes.json();
          const current = await currentRes.json();

          // Calculate total rainfall and avg temp from forecast
          let totalRainfall = 0;
          let avgTemp = 0;
          const items = forecast.list || [];
          for (const item of items) {
            totalRainfall += (item.rain?.["3h"] || 0);
            avgTemp += item.main.temp;
          }
          avgTemp = items.length ? avgTemp / items.length : 0;

          weatherData = {
            current_temp: current.main.temp,
            current_humidity: current.main.humidity,
            current_description: current.weather?.[0]?.description || "N/A",
            forecast_avg_temp: Math.round(avgTemp * 10) / 10,
            total_rainfall_mm: Math.round(totalRainfall * 10) / 10,
            forecast_items: items.slice(0, 8).map((item: any) => ({
              dt_txt: item.dt_txt,
              temp: item.main.temp,
              rain: item.rain?.["3h"] || 0,
              description: item.weather?.[0]?.description || "",
            })),
          };
        }
      } catch (e) {
        console.error("Weather fetch failed:", e);
      }
    }

    console.log("Weather data:", weatherData ? "available" : "unavailable");

    // Step 2: Call Lovable AI for comprehensive price analysis
    const weatherContext = weatherData
      ? `Weather Data for ${location}:
- Current temperature: ${weatherData.current_temp}°C
- Current humidity: ${weatherData.current_humidity}%
- Current conditions: ${weatherData.current_description}
- 3-day forecast avg temperature: ${weatherData.forecast_avg_temp}°C
- Total expected rainfall: ${weatherData.total_rainfall_mm}mm`
      : `Weather data unavailable for ${location}.`;

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const systemPrompt = `You are an expert Indian agricultural market analyst with deep knowledge of Indian wholesale market (mandi) prices, seasonal trends, and regional supply-demand dynamics. Today's date is ${dateStr}.

You must respond with ONLY valid JSON. No extra text, no markdown.`;

    const userPrompt = `Analyze the price forecast for "${crop}" in "${location}", India.

${weatherContext}

Consider:
- Current season and typical supply patterns for ${crop}
- Regional demand patterns
- Weather impact on supply/demand
- Festival seasons (if applicable)
- Transportation costs to nearby major markets
- Recent market trends in Indian mandis

Respond with this exact JSON structure:
{
  "crop_name": "${crop}",
  "location": "${location}",
  "current_price": {
    "price_per_kg": <number in INR>,
    "yesterday_price": <number>,
    "trend_percentage": <number, positive or negative>,
    "unit": "₹/kg"
  },
  "nearby_markets": [
    {"name": "<major city> APMC", "price_per_kg": <number>, "distance_km": <number>},
    {"name": "<city2> Mandi", "price_per_kg": <number>, "distance_km": <number>},
    {"name": "<city3> Market", "price_per_kg": <number>, "distance_km": <number>}
  ],
  "demand_forecast": {
    "level": "HIGH" | "MEDIUM" | "LOW",
    "confidence_percent": <number 60-95>,
    "duration": "Next 7 days",
    "reasons": ["<reason1>", "<reason2>", "<reason3>"]
  },
  "weather_impact": {
    "current_weather": "${weatherData?.current_description || 'N/A'}",
    "current_temp": "${weatherData?.current_temp || 'N/A'}°C",
    "forecast_summary": "<3-day weather forecast summary>",
    "rainfall_mm": ${weatherData?.total_rainfall_mm || 0},
    "impact_statement": "<how weather affects this crop's price>"
  },
  "price_prediction": {
    "expected_min": <number>,
    "expected_max": <number>,
    "timeline": "<e.g. By Feb 20 (in 6 days)>",
    "trend": "Rising" | "Falling" | "Stable",
    "trend_percentage": "<e.g. +15-20%>"
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
    "explanation": "<detailed explanation>",
    "best_selling_window": "<e.g. Feb 18-20>"
  },
  "negotiation_tips": [
    "<tip1 mentioning nearby market prices>",
    "<tip2 about what others got>",
    "<tip3 about negotiation strategy>"
  ],
  "data_freshness": "${dateStr}",
  "disclaimer": "Prices are AI-estimated based on market trends. Verify with local mandi before selling."
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
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get price forecast" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI price forecast received");

    // Parse JSON from response
    let forecastData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      forecastData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse price forecast");
    }

    return new Response(
      JSON.stringify(forecastData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Price forecast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
