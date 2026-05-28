import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHERMAP_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");

    if (!OPENWEATHERMAP_API_KEY) {
      throw new Error("OPENWEATHERMAP_API_KEY is not set");
    }
    const { lat, lon, city } = await req.json();

    let weatherUrl: string;
    let forecastUrl: string;

    if (lat && lon) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
    } else if (city) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
    } else {
      return new Response(
        JSON.stringify({ error: "Please provide either coordinates (lat, lon) or city name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching weather data...");

    // Fetch current weather and forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl),
    ]);

    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();
      console.error("Weather API error:", currentResponse.status, errorText);
      throw new Error("Failed to fetch current weather");
    }

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error("Forecast API error:", forecastResponse.status, errorText);
      throw new Error("Failed to fetch forecast");
    }

    const currentWeather = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process forecast to get daily data (every 8 items = 1 day in 3-hour intervals)
    const dailyForecast = [];
    const processedDates = new Set();

    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000).toDateString();
      if (!processedDates.has(date) && dailyForecast.length < 7) {
        processedDates.add(date);
        dailyForecast.push({
          date: item.dt,
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          humidity: item.main.humidity,
          weather: item.weather[0],
          wind_speed: item.wind.speed,
          pop: item.pop, // Probability of precipitation
        });
      }
    }

    // Generate agricultural insights based on weather
    const agriculturalInsights = generateAgriculturalInsights(currentWeather, dailyForecast);

    const result = {
      current: {
        temp: currentWeather.main.temp,
        feels_like: currentWeather.main.feels_like,
        humidity: currentWeather.main.humidity,
        pressure: currentWeather.main.pressure,
        wind_speed: currentWeather.wind.speed,
        wind_deg: currentWeather.wind.deg,
        visibility: currentWeather.visibility,
        clouds: currentWeather.clouds.all,
        weather: currentWeather.weather[0],
        sunrise: currentWeather.sys.sunrise,
        sunset: currentWeather.sys.sunset,
        location: currentWeather.name,
        country: currentWeather.sys.country,
      },
      forecast: dailyForecast,
      agricultural_insights: agriculturalInsights,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Weather error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateAgriculturalInsights(current: any, forecast: any[]) {
  const insights: string[] = [];
  const alerts: { type: string; message: string; severity: string }[] = [];

  // Temperature-based insights
  if (current.main.temp > 35) {
    alerts.push({
      type: "heat",
      message: "High temperature alert! Consider irrigation during early morning or evening hours.",
      severity: "warning",
    });
  } else if (current.main.temp < 10) {
    alerts.push({
      type: "cold",
      message: "Low temperature alert! Protect sensitive crops from frost damage.",
      severity: "warning",
    });
  }

  // Humidity-based insights
  if (current.main.humidity > 80) {
    insights.push("High humidity levels - increased risk of fungal diseases. Monitor crops closely.");
    alerts.push({
      type: "disease_risk",
      message: "High humidity may promote fungal growth. Consider preventive fungicide application.",
      severity: "info",
    });
  } else if (current.main.humidity < 30) {
    insights.push("Low humidity - ensure adequate irrigation to prevent crop stress.");
  }

  // Wind-based insights
  if (current.wind.speed > 10) {
    insights.push("High winds detected - avoid pesticide spraying as drift may occur.");
    alerts.push({
      type: "wind",
      message: "Not suitable for spraying operations due to high wind speed.",
      severity: "warning",
    });
  }

  // Rain probability insights
  const rainExpected = forecast.some((day) => day.pop > 0.5);
  if (rainExpected) {
    insights.push("Rain expected in coming days - plan irrigation accordingly and consider postponing fertilizer application.");
  } else {
    insights.push("No significant rainfall expected - maintain regular irrigation schedule.");
  }

  // Optimal conditions
  if (current.main.temp >= 20 && current.main.temp <= 30 && current.main.humidity >= 40 && current.main.humidity <= 70) {
    insights.push("Optimal growing conditions - good time for planting or transplanting.");
  }

  // Spraying conditions
  const sprayingConditions = current.wind.speed < 8 && current.main.humidity > 40 && current.main.humidity < 80;
  if (sprayingConditions && current.weather[0].main !== "Rain") {
    insights.push("Favorable conditions for pesticide/fertilizer spraying.");
  }

  return {
    insights,
    alerts,
    farming_recommendations: {
      irrigation: getIrrigationAdvice(current, forecast),
      spraying: sprayingConditions ? "Favorable" : "Not recommended",
      harvesting: getHarvestingAdvice(current, forecast),
    },
  };
}

function getIrrigationAdvice(current: any, forecast: any[]): string {
  const rainExpected = forecast.slice(0, 3).some((day) => day.pop > 0.4);
  if (rainExpected) {
    return "Reduce irrigation - rain expected";
  }
  if (current.main.temp > 30) {
    return "Increase irrigation frequency - high evaporation expected";
  }
  return "Maintain normal irrigation schedule";
}

function getHarvestingAdvice(current: any, forecast: any[]): string {
  const rainSoon = forecast[0]?.pop > 0.5;
  if (rainSoon) {
    return "Consider expediting harvest if crops are ready - rain expected soon";
  }
  if (current.main.humidity > 75) {
    return "Allow crops to dry before harvesting for better storage quality";
  }
  return "Good conditions for harvesting";
}
