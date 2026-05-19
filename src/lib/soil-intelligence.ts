import { z } from "zod";

export interface FetchStatus {
  apiName: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  details?: string;
}

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  }
};

export const analyzeSoilWithAI = async (
  lat: number,
  lon: number,
  locationName: string,
  onStatusChange?: (statuses: Record<string, FetchStatus>) => void
): Promise<any> => {
  const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

  if (!GROQ_KEY) throw new Error("Groq API key is missing from environment variables.");

  const statuses: Record<string, FetchStatus> = {
    openMeteoSoil: { apiName: "OpenMeteo Soil Data", status: 'pending' },
    openMeteoWeather: { apiName: "OpenMeteo Weather Data", status: 'pending' },
    groqAI: { apiName: "Groq AI Analysis", status: 'pending' }
  };

  const updateStatus = (key: string, status: 'success' | 'failed' | 'timeout', details?: string) => {
    statuses[key] = { ...statuses[key], status, details };
    onStatusChange?.({ ...statuses });
  };

  // Trigger initial pending state callback
  onStatusChange?.({ ...statuses });

  let openMeteoSoilData: any = null;
  let openMeteoWeatherData: any = null;

  // 1. Fetch OpenMeteo Soil Data
  try {
    const res = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=soil_temperature_0cm,soil_temperature_6cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm&forecast_days=7`);
    if (!res.ok) throw new Error("Response not OK");
    openMeteoSoilData = await res.json();
    updateStatus('openMeteoSoil', 'success');
  } catch (e: any) {
    console.error("OpenMeteo Soil fetch failed:", e);
    updateStatus('openMeteoSoil', e.message === 'timeout' ? 'timeout' : 'failed');
  }

  // 2. Fetch OpenMeteo Weather Data
  try {
    const res = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=rain_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&forecast_days=7&timezone=Asia/Kolkata`);
    if (!res.ok) throw new Error("Response not OK");
    openMeteoWeatherData = await res.json();
    updateStatus('openMeteoWeather', 'success');
  } catch (e: any) {
    console.error("OpenMeteo Weather fetch failed:", e);
    updateStatus('openMeteoWeather', e.message === 'timeout' ? 'timeout' : 'failed');
  }

  // Clean datasets to prevent 413 Payload Too Large error
  let cleanSoilData: any = null;
  if (openMeteoSoilData && openMeteoSoilData.hourly) {
    const hourly = openMeteoSoilData.hourly;
    const avg = (arr: number[]) => arr && arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
    const max = (arr: number[]) => arr && arr.length ? parseFloat(Math.max(...arr).toFixed(2)) : null;
    const min = (arr: number[]) => arr && arr.length ? parseFloat(Math.min(...arr).toFixed(2)) : null;

    cleanSoilData = {
      surfaceTemp: {
        avg: avg(hourly.soil_temperature_0cm),
        min: min(hourly.soil_temperature_0cm),
        max: max(hourly.soil_temperature_0cm)
      },
      deepTemp: {
        avg: avg(hourly.soil_temperature_6cm),
        min: min(hourly.soil_temperature_6cm),
        max: max(hourly.soil_temperature_6cm)
      },
      moistureAverage: {
        depth_0_1cm: avg(hourly.soil_moisture_0_to_1cm),
        depth_1_3cm: avg(hourly.soil_moisture_1_to_3cm),
        depth_3_9cm: avg(hourly.soil_moisture_3_to_9cm)
      }
    };
  }

  let cleanMeteoWeatherData: any = null;
  if (openMeteoWeatherData && openMeteoWeatherData.daily) {
    const daily = openMeteoWeatherData.daily;
    cleanMeteoWeatherData = daily.time?.map((time: string, idx: number) => ({
      date: time,
      rainMm: daily.rain_sum?.[idx],
      rainProbMax: daily.precipitation_probability_max?.[idx],
      tempMax: daily.temperature_2m_max?.[idx],
      tempMin: daily.temperature_2m_min?.[idx],
      windSpeedMax: daily.wind_speed_10m_max?.[idx]
    })) || null;
  }

  // 3. Send to Groq for AI Synthesis
  try {
    updateStatus('groqAI', 'pending');
    
    const prompt = `
You are an expert Indian soil scientist and agricultural advisor. Based on the following sanitized sensor and forecast data for an agricultural region in India (${locationName}), generate a complete, structured soil analysis report.

RAW SATELLITE & SENSOR DATA:
Location: ${locationName} (Latitude: ${lat}, Longitude: ${lon})

1. OpenMeteo Soil Sensor Readings (Current & 7-Day Averages/Ranges):
${cleanSoilData ? JSON.stringify(cleanSoilData) : "UNAVAILABLE (Using regional soil knowledge fallback)"}
(Note: Cleaned fields describe surfaceTemp (0cm), deepTemp (6cm) and moisture at depths 0_1cm, 1_3cm, 3_9cm)

2. OpenMeteo Daily Weather Forecast (Next 7 Days):
${cleanMeteoWeatherData ? JSON.stringify(cleanMeteoWeatherData) : "UNAVAILABLE"}

CRITICAL AGRICULTURAL DIRECTIVE:
If any of the OpenMeteo sensor datasets are "UNAVAILABLE" due to sensor timeout or service failure, use your deep regional knowledge of Indian geography, agro-climatic zones, and soil science to estimate scientifically accurate historical soil conditions, soil type classification, pH level, clay/sand ratios, and agricultural recommendations specifically for ${locationName}. Llama-3 possesses advanced training data regarding the soil taxonomy and farming dynamics of every major district in India.

Based on this, return ONLY a valid JSON object matching this EXACT structure. Do not include markdown formatting or extra text.

{
  "locationAndType": {
    "locationName": "${locationName}",
    "soilClassification": "String (e.g., Alfisol, Vertisol, Inceptisol)",
    "soilTexture": "String (e.g., Clayey Sand, Clay Loam, Red Loamy)",
    "colorIndicator": "hex code representing typical regional soil color (e.g., #8c3f2b for red laterite, #3a2e2b for black cotton)"
  },
  "healthScore": {
    "score": number (0-100 based on physical parameters, moisture suitability, and crop viability),
    "phLevel": number (between 4.5 and 8.5),
    "nitrogenStatus": "Deficient" | "Adequate" | "Rich",
    "organicCarbonPercent": number (estimated organically, e.g. 0.65),
    "clayRatio": number (0-100),
    "sandRatio": number (0-100)
  },
  "bestCrops": [
    { "name": "String", "expectedYield": "String (e.g., 18-22 Quintals/Acre)", "season": "Kharif" | "Rabi" | "Zaid", "icon": "TreePine" | "Leaf" | "Sprout", "isBestMatch": boolean }
  ],
  "weatherForecast": {
    "soilMoistureTrend": "Increasing" | "Stable" | "Decreasing",
    "bestDaysToPlant": "String (e.g., Next Wednesday or Tomorrow)",
    "rainRiskWarnings": "String (describe any heavy precipitation warning or drought stress warning)",
    "sevenDayRainfall": [
      { "day": "Mon", "rainMm": number },
      { "day": "Tue", "rainMm": number },
      { "day": "Wed", "rainMm": number },
      { "day": "Thu", "rainMm": number },
      { "day": "Fri", "rainMm": number },
      { "day": "Sat", "rainMm": number },
      { "day": "Sun", "rainMm": number }
    ]
  },
  "fertilizerPlan": {
    "recommendedFertilizers": ["String (e.g., Urea, NPK 19-19-19, Single Super Phosphate)"],
    "npkRatio": "String (e.g., 4:2:1)",
    "applicationSchedule": "String",
    "dosagePerAcre": "String"
  },
  "improvementTips": {
    "actionableTips": ["String (practical agricultural improvement practices)"],
    "recoveryTimeline": "String (e.g., 2-3 Months)",
    "longTermAdvice": "String",
    "warnings": ["String (if any specific nutrient or moisture stress exists)"]
  }
}
`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      throw new Error("Failed to get analysis from Groq");
    }

    const groqData = await groqRes.json();
    const result = JSON.parse(groqData.choices[0].message.content);
    updateStatus('groqAI', 'success');
    return result;

  } catch (error: any) {
    console.error("Groq AI compilation failed:", error);
    updateStatus('groqAI', 'failed');
    throw error;
  }
};
