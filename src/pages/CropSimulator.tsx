import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudRain, Droplet, Sun, Thermometer, Info, ShieldAlert, BadgeIndianRupee, TrendingUp, RefreshCw, Send, Loader2, User, Clock } from "lucide-react";
import { INDIA_STATES_AND_DISTRICTS } from "@/lib/india-states";
import { supabase } from "@/integrations/supabase/client";
import "./CropSimulator.css";

// Types based on the prompt's JSON structure
interface SimulationResult {
  season: {
    crop: string;
    plantingMonth: string;
    harvestMonth: string;
    durationDays: number;
    seasonType: string;
  };
  weatherRisks: {
    level: "LOW" | "MEDIUM" | "HIGH";
    risks: string[];
    avgTempC: number;
    rainfallMm: number;
  };
  diseases: Array<{
    name: string;
    likelihood: "LOW" | "MEDIUM" | "HIGH";
    prevention: string;
  }>;
  priceForecast: {
    minPricePerQuintal: number;
    maxPricePerQuintal: number;
    trend: "Rising" | "Stable" | "Falling";
    bestSellMonth: string;
    reasoning: string;
  };
  profitPerAcre: {
    costOfCultivation: number;
    expectedYieldQuintals: number;
    expectedRevenue: number;
    netProfit: number;
    currency: string;
  };
  farmingTips: string[];
}

const CROPS = [
  // Cereals & Millets
  "Paddy", "Wheat", "Maize", "Ragi (Finger Millet)", "Jowar (Sorghum)", "Bajra (Pearl Millet)",
  // Pulses
  "Tur (Pigeon Pea)", "Bengal Gram (Chickpea)", "Green Gram (Moong)", "Black Gram (Urad)", "Cowpea (Alasande)", "Field Bean (Avarekai)",
  // Oilseeds
  "Groundnut", "Soybean", "Sunflower", "Safflower", "Sesame (Til)", "Castor", "Linseed",
  // Cash Crops & Spices
  "Sugarcane", "Cotton", "Tobacco", "Arecanut", "Coconut", "Coffee", "Pepper", "Cardamom", "Cashew", "Chilli (Byadagi)", "Turmeric", "Ginger", "Garlic", "Coriander", "Mustard", "Curry Leaves",
  // Fruits
  "Mango", "Banana (Nanjangud Rasabale)", "Pomegranate", "Grapes", "Coorg Orange", "Sapota (Chikoo)", "Jackfruit", "Papaya", "Guava", "Watermelon", "Fig (Anjeer)",
  // Vegetables
  "Tomato", "Onion (Bengaluru Rose)", "Potato", "Sweet Potato", "Brinjal (Mattu Gulla)", "Lady's Finger (Okra)", "Bitter Gourd", "Bottle Gourd", "Ridge Gourd", "Cucumber", "Pumpkin", "Cabbage", "Cauliflower", "Carrot", "Radish", "Beetroot", "French Beans", "Cluster Beans",
  // Leafy Vegetables
  "Spinach (Palak)", "Amaranth (Dantina Soppu)", "Mint (Pudina)"
].sort();

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const LANG_SYSTEM_SUFFIX = {
  "en-IN": "Always respond in English.",
  "hi-IN": "Always respond in Hindi (हिंदी). Use Devanagari script.",
  "kn-IN": "Always respond in Kannada (ಕನ್ನಡ). Use Kannada script.",
  "ta-IN": "Always respond in Tamil (தமிழ்). Use Tamil script.",
  "te-IN": "Always respond in Telugu (తెలుగు). Use Telugu script.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/krishi-setu", label: "Krishi Setu" },
  { href: "/farmer-blog", label: "Kisan Times" },
  { href: "/diagnosis", label: "Diagnosis" },
  { href: "/price-forecast", label: "Price Forecasting" },
  { href: "/simulator", label: "Crop Simulator" },
  { href: "/weather", label: "Weather" },
  { href: "/soil-intelligence", label: "Soil Intelligence" },
];

export default function CropSimulator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Input State
  const [selectedCrop, setSelectedCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setStateName] = useState("");
  const [month, setMonth] = useState("");

  // App State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [acres, setAcres] = useState<number>(1);
  const [weatherError, setWeatherError] = useState(false);

  // Chat State
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const simulateSeason = async () => {
    if (!selectedCrop || !district || !state || !month) {
      toast({
        title: "Missing Information",
        description: "Please fill out all 4 fields to run the simulation.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setWeatherError(false);
    setChatHistory([]);

    try {
      // Step 1: OpenWeatherMap Geocoding (key is lower-sensitivity, weather public API)
      let lat = 0;
      let lon = 0;
      let weatherData: { avgTemp: number; rainfall: number; humidity: number } | null = null;

      const weatherKey = import.meta.env.VITE_OPENWEATHER_KEY;

      try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${district},${state},IN&limit=1&appid=${weatherKey}`);
        const geoData = await geoRes.json();

        if (geoData && geoData.length > 0) {
          lat = geoData[0].lat;
          lon = geoData[0].lon;

          const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherKey}&units=metric`);
          const forecastData = await forecastRes.json();

          if (forecastData.list) {
            let tempSum = 0;
            let rainSum = 0;
            let humSum = 0;

            forecastData.list.forEach((item: any) => {
              tempSum += item.main.temp;
              humSum += item.main.humidity;
              if (item.rain && item.rain['3h']) rainSum += item.rain['3h'];
            });

            weatherData = {
              avgTemp: Math.round(tempSum / forecastData.list.length),
              humidity: Math.round(humSum / forecastData.list.length),
              rainfall: Math.round(rainSum)
            };
          }
        } else {
          setWeatherError(true);
        }
      } catch {
        setWeatherError(true);
      }

      // Step 2: Call crop-simulator edge function — GROQ_API_KEY stays server-side
      const { data: simData, error: simError } = await supabase.functions.invoke('crop-simulator', {
        body: {
          mode: 'simulate',
          crop: selectedCrop,
          district,
          state,
          month,
          weatherData
        }
      });

      if (simError) throw new Error(simError.message || 'Simulation failed');

      setResult(simData);

    } catch (err: any) {
      toast({
        title: "Simulation Failed",
        description: err.message || "An error occurred during simulation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!followUpQuestion.trim() || !result) return;

    const newChat = [...chatHistory, { role: 'user' as const, content: followUpQuestion }];
    setChatHistory(newChat);
    setFollowUpQuestion("");
    setIsChatLoading(true);

    try {
      // Route through crop-simulator edge function — GROQ_API_KEY stays server-side
      const chatMessages = newChat.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('crop-simulator', {
        body: {
          mode: 'chat',
          crop: result?.season?.crop ?? selectedCrop,
          district,
          state,
          month,
          chatHistory: chatMessages
        }
      });

      if (error) throw new Error(error.message);
      setChatHistory([...newChat, { role: 'ai', content: data?.reply ?? 'No response received.' }]);
    } catch {
      toast({ title: "Failed to get answer", variant: "destructive" });
    } finally {
      setIsChatLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === "HIGH") return "text-red-500 border-red-500/50";
    if (level === "MEDIUM") return "text-yellow-500 border-yellow-500/50";
    return "text-green-500 border-green-500/50";
  };

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="crop-simulator-page">
        <nav className="header-nav">
          <div className="logo-text">FARM SHIELD<span>®</span></div>
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.href} className={location.pathname === link.href ? "active" : ""}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="nav-right-items">
            <div className="history-btn" onClick={() => navigate("/history")}>
              <Clock className="h-4 w-4" />
              History
            </div>
            <div className="user-profile"></div>
          </div>
        </nav>

        <main className="dashboard-main py-8 px-4">
          <header className="section-header">
            <h1 className="section-title">Crop Simulator</h1>
            <p className="section-subtitle">What-If AI Crop Planner</p>
          </header>

          {/* Section 1: Tactical Input Panel */}
          <section className="input-control-panel">
            <div className="tactical-card card-green">
              <div className="card-label">Select Crop</div>
              <div className="tactical-input-container">
                <select 
                  className="tactical-select"
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                >
                  <option value="">E.g. Paddy</option>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>

            <div className="tactical-card card-blue">
              <div className="card-label">State</div>
              <div className="tactical-input-container">
                <select 
                  className="tactical-select"
                  value={state}
                  onChange={(e) => { setStateName(e.target.value); setDistrict(""); }}
                >
                  <option value="">Select state</option>
                  {Object.keys(INDIA_STATES_AND_DISTRICTS).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>

            <div className="tactical-card card-silver-1">
              <div className="card-label">District</div>
              <div className="tactical-input-container">
                <select 
                  className="tactical-select"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!state}
                >
                  <option value="">Select district</option>
                  {state && INDIA_STATES_AND_DISTRICTS[state]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>

            <div className="tactical-card card-silver-2">
              <div className="card-label">Month of Planting</div>
              <div className="tactical-input-container">
                <select 
                  className="tactical-select"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>
          </section>

          <div className="action-flex-container">
            <button 
              className="btn-simulate-thruster"
              onClick={simulateSeason}
              disabled={isLoading}
            >
              {isLoading ? "CALCULATING..." : "Simulate Season"}
            </button>
            <div className="badge-maximize">
              <svg viewBox="0 0 24 24"><path d="M11 21h-1l1-7H4.5c-.58 0-.91-.42-.76-.95l2.5-8.83C6.46 3.47 7.05 3 7.7 3h6.3c.73 0 1.18.58.98 1.34l-1.93 6.66H20c.62 0 .92.46.72 1.05l-7.3 11.23c-.42.66-1.2.32-1.3-.28z"/></svg>
              MAXIMIZE YIELD!
            </div>
          </div>

          {weatherError && (
            <p className="text-xs text-amber-500 mb-8 text-center flex items-center justify-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Could not find local weather. Proceeding with regional AI data.
            </p>
          )}

          {/* Section 2: Loading & Results */}
          {isLoading && (
            <div className="space-y-6 animate-pulse mb-12">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center space-x-2 text-[#00ff66] font-medium">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>AI IS SIMULATING YOUR CROP SEASON...</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[250px] w-full rounded-xl bg-gray-800/50" />
                <Skeleton className="h-[250px] w-full rounded-xl bg-gray-800/50" />
                <Skeleton className="h-[250px] w-full rounded-xl bg-gray-800/50" />
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
              <div className="dashboard-footer-grid">
                {/* Result Card 1: Overview */}
                <div className="footer-panel">
                  <div className="panel-heading">Season Overview</div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Crop Details</p>
                      <p className="font-bold text-lg text-white">{result.season.crop} in {district}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase">Timeline</p>
                        <p className="font-medium text-xs">{result.season.plantingMonth} - {result.season.harvestMonth}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase">Duration</p>
                        <p className="font-medium text-xs">{result.season.durationDays} Days</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[#00ff66] border-[#00ff66]/30 uppercase text-[10px]">
                      {result.season.seasonType} Season
                    </Badge>
                  </div>
                  <svg className="circuit-decor" viewBox="0 0 200 100">
                    <path d="M0,80 L40,80 L60,60 L120,60 L140,40 L200,40" stroke="rgba(0,255,102,0.1)" strokeWidth="1" fill="none"/>
                  </svg>
                </div>

                {/* Result Card 2: Weather */}
                <div className="footer-panel">
                  <div className="panel-heading">Weather Metrics</div>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 bg-[#00ccff]/10 text-[#00ccff] px-3 py-1.5 rounded-lg border border-[#00ccff]/20 text-xs font-bold">
                        <Thermometer className="h-3 w-3" /> {result.weatherRisks.avgTempC}°C
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#00ccff]/10 text-[#00ccff] px-3 py-1.5 rounded-lg border border-[#00ccff]/20 text-xs font-bold">
                        <Droplet className="h-3 w-3" /> {result.weatherRisks.rainfallMm}mm
                      </div>
                    </div>
                    <div className={`text-xs font-bold py-1 px-3 border rounded-md w-fit ${getRiskColor(result.weatherRisks.level)}`}>
                      {result.weatherRisks.level} RISK
                    </div>
                    <ul className="space-y-2">
                      {result.weatherRisks.risks.map((risk, i) => (
                        <li key={i} className="flex gap-2 text-xs text-gray-400">
                          <span className="text-[#00ccff]">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Result Card 3: Market */}
                <div className="footer-panel">
                  <div className="panel-heading">Market Intelligence</div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Estimated Price</p>
                      <p className="text-3xl font-bold text-white">₹{result.priceForecast.minPricePerQuintal} - {result.priceForecast.maxPricePerQuintal}</p>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Market Trend</p>
                        <p className={`font-bold text-xs ${result.priceForecast.trend === 'Rising' ? 'text-[#00ff66]' : 'text-red-500'}`}>{result.priceForecast.trend}</p>
                      </div>
                      <TrendingUp className={`h-4 w-4 ${result.priceForecast.trend === 'Rising' ? 'text-[#00ff66]' : 'text-red-500'}`} />
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Best window: {result.priceForecast.bestSellMonth}</p>
                  </div>
                </div>
              </div>

              {/* Profit Panel */}
              <div className="footer-panel w-full">
                <div className="panel-heading">Financial Simulator</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest">Land Size (Acres)</label>
                    <div className="tactical-input-container">
                      <input 
                        type="number" 
                        className="tactical-input"
                        value={acres}
                        onChange={e => setAcres(Number(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div className="text-center p-4 border border-white/5 rounded-xl bg-white/2">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Est. Cost</p>
                    <p className="text-xl font-bold text-red-400">₹{(result.profitPerAcre.costOfCultivation * acres).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center p-4 border border-white/5 rounded-xl bg-white/2">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Est. Revenue</p>
                    <p className="text-xl font-bold text-[#00ff66]">₹{(result.profitPerAcre.expectedRevenue * acres).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center p-4 border border-[#00ff66]/20 rounded-xl bg-[#00ff66]/5">
                    <p className="text-[10px] text-[#00ff66] uppercase font-bold mb-1">Projected Profit</p>
                    <p className="text-2xl font-black text-white">₹{(result.profitPerAcre.netProfit * acres).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="footer-panel">
                  <div className="panel-heading">Disease Defense</div>
                  <div className="space-y-3">
                    {result.diseases.map((disease, i) => (
                      <div key={i} className="bg-black/40 border border-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-xs text-white">{disease.name}</p>
                          <span className={`text-[10px] font-black ${disease.likelihood === 'HIGH' ? 'text-red-500' : 'text-yellow-500'}`}>{disease.likelihood} LIKELIHOOD</span>
                        </div>
                        <p className="text-[11px] text-gray-400">{disease.prevention}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="footer-panel">
                  <div className="panel-heading">Tactical Tips</div>
                  <div className="space-y-2">
                    {result.farmingTips.map((tip, i) => (
                      <div key={i} className="flex gap-3 bg-white/2 p-3 rounded-lg border border-white/5 items-start">
                        <div className="bg-[#00ff66]/20 p-1.5 rounded-md mt-0.5">
                          <Sun className="h-3 w-3 text-[#00ff66]" />
                        </div>
                        <p className="text-xs text-gray-300 leading-snug">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Follow Up QA */}
              <div className="footer-panel w-full">
                <div className="panel-heading">Tactical Advisory (AI Chat)</div>
                <div className="space-y-4">
                  {chatHistory.length > 0 && (
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto p-4 border border-white/5 rounded-lg bg-black/40">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-4 py-2 text-xs ${msg.role === 'user' ? 'bg-[#1e6b3f] text-white' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                            <span className="text-[10px] text-gray-500">Processing tactical data...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="tactical-input flex-1"
                      placeholder="Ask about fertilizers, market timing, or risks..."
                      value={followUpQuestion}
                      onChange={e => setFollowUpQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                      disabled={isChatLoading}
                    />
                    <button 
                      onClick={handleAskQuestion} 
                      disabled={isChatLoading || !followUpQuestion.trim()} 
                      className="bg-[#1e6b3f] hover:bg-[#24824d] px-4 rounded-lg border border-[#2ae27a]/50 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="base-floor">
          <div className="copyright-text">© 2026 Farm Shield. Tactical Simulation Suite.</div>
          <div className="slider-rail-system">
            <div className="slider-node"></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
