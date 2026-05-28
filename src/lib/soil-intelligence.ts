import { supabase } from "@/integrations/supabase/client";

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
    updateStatus('openMeteoSoil', e.message === 'timeout' ? 'timeout' : 'failed');
  }

  // 2. Fetch OpenMeteo Weather Data
  try {
    const res = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=rain_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&forecast_days=7&timezone=Asia/Kolkata`);
    if (!res.ok) throw new Error("Response not OK");
    openMeteoWeatherData = await res.json();
    updateStatus('openMeteoWeather', 'success');
  } catch (e: any) {
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

  // 3. Send to Supabase edge function (groq-soil) — keeps GROQ_API_KEY server-side
  try {
    updateStatus('groqAI', 'pending');

    const { data, error } = await supabase.functions.invoke('groq-soil', {
      body: { lat, lon, locationName, cleanSoilData, cleanMeteoWeatherData }
    });

    if (error) throw new Error(error.message || 'groq-soil edge function failed');

    updateStatus('groqAI', 'success');
    return data;
  } catch (error: any) {
    updateStatus('groqAI', 'failed');
    throw error;
  }
};
