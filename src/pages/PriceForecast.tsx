import { useState, useEffect, useCallback } from "react";
import { m, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Search, Mic, MicOff, ArrowLeft, TrendingUp, TrendingDown,
  Minus, Flame, Snowflake, CloudRain, Sun, DollarSign, Lightbulb,
  AlertTriangle, CheckCircle, XCircle, Star, Loader2, LocateFixed,
  ChevronDown, ChevronUp, Store, ThumbsUp, ThumbsDown, ShoppingCart,
  Building2, Users, Database,
} from "lucide-react";
import { crops, cropCategories, indianCities, type CropItem, type CropCategory } from "@/lib/crop-data";

type Screen = "location" | "crop" | "results";

interface Dealer {
  name: string;
  type: string;
  expected_price_per_kg: number;
  payment_terms: string;
  minimum_qty_kg: number;
  contact_method: string;
  pros: string[];
  cons: string[];
}

interface ForecastResult {
  crop_name: string;
  location: string;
  current_price: {
    price_per_kg: number;
    yesterday_price: number;
    trend_percentage: number;
    unit: string;
  };
  nearby_markets: Array<{ name: string; price_per_kg: number; distance_km: number }>;
  best_dealers?: Dealer[];
  sell_to_recommendation?: {
    best_option: string;
    reason: string;
    expected_extra_earnings_percent: number;
  };
  demand_forecast: {
    level: string;
    confidence_percent: number;
    duration: string;
    reasons: string[];
  };
  weather_impact: {
    current_weather: string;
    current_temp: string;
    forecast_summary: string;
    rainfall_mm: number;
    impact_statement: string;
  };
  price_prediction: {
    expected_min: number;
    expected_max: number;
    timeline: string;
    trend: string;
    trend_percentage: string;
  };
  negotiation_guide: {
    dont_sell_below: number;
    dont_sell_below_reason: string;
    fair_price_min: number;
    fair_price_max: number;
    fair_price_advice: string;
    best_case: number;
    best_case_condition: string;
  };
  recommendation: {
    action: string;
    wait_days: number;
    explanation: string;
    best_selling_window: string;
  };
  negotiation_tips: string[];
  agmarknet_source?: boolean;
  data_freshness: string;
  disclaimer: string;
}

export default function PriceForecast() {
  const [screen, setScreen] = useState<Screen>("location");
  const [location, setLocation] = useState("");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [cropSearch, setCropSearch] = useState("");
  const [cropCategory, setCropCategory] = useState<CropCategory>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [tipsExpanded, setTipsExpanded] = useState(false);
  const [dealersExpanded, setDealersExpanded] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { toast } = useToast();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });
  const bgGradient = useMotionTemplate`radial-gradient(800px circle at ${smoothX}px ${smoothY}px, rgba(34,197,94,0.12), transparent 80%)`;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const saved = localStorage.getItem("price_recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (crop: string, loc: string) => {
    const key = `${crop} - ${loc}`;
    const updated = [key, ...recentSearches.filter(s => s !== key)].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem("price_recent_searches", JSON.stringify(updated));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", description: "Please enter your location manually.", variant: "destructive" });
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
          const data = await res.json();
          const city = data.city || data.locality || "Unknown";
          const state = data.principalSubdivision || "";
          setLocation(`${city}, ${state}`);
        } catch {
          setLocation("Location detected");
        }
        setIsDetectingLocation(false);
      },
      () => {
        toast({ title: "Location access denied", description: "Please enter your location manually." });
        setIsDetectingLocation(false);
      }
    );
  };

  useEffect(() => {
    if (location.length < 2) { setLocationSuggestions([]); return; }
    const q = location.toLowerCase();
    setLocationSuggestions(indianCities.filter(c => c.toLowerCase().includes(q)).slice(0, 5));
  }, [location]);

  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Voice input not supported", variant: "destructive" });
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.onresult = (e: any) => { setCropSearch(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const filteredCrops = crops.filter(c => {
    const matchCategory = cropCategory === "all" || c.category === cropCategory;
    const q = cropSearch.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.hindi.includes(cropSearch) || c.id.includes(q);
    return matchCategory && matchSearch;
  });

  const fetchForecast = async () => {
    if (!selectedCrop || !location) return;
    setIsLoading(true);
    setScreen("results");
    try {
      const { data, error } = await supabase.functions.invoke("price-forecast", {
        body: { crop: selectedCrop.name, location, lat: locationCoords?.lat, lon: locationCoords?.lon },
      });
      if (error) throw error;
      setResult(data);
      saveRecentSearch(selectedCrop.name, location);
    } catch (err: any) {
      toast({ title: "Failed to fetch forecast", description: err.message, variant: "destructive" });
      setScreen("crop");
    } finally {
      setIsLoading(false);
    }
  };

  const getDemandIcon = (level: string) => {
    switch (level) {
      case "HIGH": return <Flame className="h-5 w-5 text-red-500" />;
      case "LOW": return <Snowflake className="h-5 w-5 text-blue-500" />;
      default: return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200";
      case "LOW": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getDealerIcon = (type: string) => {
    if (type.includes("Retail")) return <Store className="h-5 w-5 text-blue-600" />;
    if (type.includes("Online")) return <ShoppingCart className="h-5 w-5 text-purple-600" />;
    if (type.includes("FPO") || type.includes("Cooperative")) return <Users className="h-5 w-5 text-green-600" />;
    return <Building2 className="h-5 w-5 text-orange-600" />;
  };

  // --- Screen 1: Location ---
  if (screen === "location") {
    return (
      <Layout>
        <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
        <div className="container max-w-lg mx-auto py-8 px-4 relative z-10">
          <h1 className="text-2xl font-bold text-center mb-2">Price Forecasting</h1>
          <p className="text-muted-foreground text-center mb-8">Real Agmarknet data + AI-powered analysis</p>

          <div className="flex flex-col items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-primary" />
            </div>

            <Button size="lg" className="w-full gap-2" onClick={detectLocation} disabled={isDetectingLocation}>
              {isDetectingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {isDetectingLocation ? "Detecting..." : "Use Current Location"}
            </Button>

            <div className="flex items-center gap-3 w-full">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Enter your city or state" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10" />
              {locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-card shadow-lg">
                  {locationSuggestions.map((s) => (
                    <button key={s} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg" onClick={() => { setLocation(s); setLocationSuggestions([]); }}>
                      <MapPin className="inline h-3 w-3 mr-2 text-muted-foreground" />{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {recentSearches.length > 0 && (
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2">Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => {
                      const parts = s.split(" - ");
                      if (parts[1]) setLocation(parts[1]);
                    }}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Button size="lg" className="w-full mt-4" disabled={!location.trim()} onClick={() => setScreen("crop")}>
              Continue
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Screen 2: Crop Selection ---
  if (screen === "crop") {
    return (
      <Layout>
        <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
        <div className="container max-w-2xl mx-auto py-6 px-4 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setScreen("location")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-xl font-bold">Select Crop</h1>
              <Badge variant="outline" className="mt-1 cursor-pointer" onClick={() => setScreen("location")}>
                <MapPin className="h-3 w-3 mr-1" /> {location}
              </Badge>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Enter crop name (English or Hindi)" value={cropSearch} onChange={(e) => setCropSearch(e.target.value)} className="pl-10 pr-10" />
            <button className={`absolute right-3 top-2.5 p-0.5 rounded-full ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} onClick={toggleVoiceInput}>
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {cropCategories.map(cat => (
              <Button key={cat.id} variant={cropCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setCropCategory(cat.id)} className="whitespace-nowrap">
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
            {filteredCrops.map(crop => (
              <button key={crop.id} className={`relative p-3 rounded-xl border-2 text-center transition-all hover:shadow-md ${selectedCrop?.id === crop.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"}`} onClick={() => setSelectedCrop(crop)}>
                {selectedCrop?.id === crop.id && <CheckCircle className="absolute top-1 right-1 h-4 w-4 text-primary" />}
                <span className="text-2xl block mb-1">{crop.emoji}</span>
                <p className="text-xs font-medium leading-tight">{crop.name}</p>
                <p className="text-[10px] text-muted-foreground">{crop.hindi}</p>
              </button>
            ))}
          </div>

          <Button size="lg" className="w-full" disabled={!selectedCrop} onClick={fetchForecast}>
            Get Price Forecast
          </Button>
        </div>
      </Layout>
    );
  }

  // --- Screen 3: Results Dashboard ---
  return (
    <Layout>
      <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
      <div className="container max-w-2xl mx-auto py-6 px-4 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => { setScreen("crop"); setResult(null); }}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{selectedCrop?.emoji} {selectedCrop?.name} — {location}</h1>
            {result && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">Updated: {result.data_freshness}</p>
                {result.agmarknet_source && (
                  <Badge variant="outline" className="text-[10px] gap-1 h-5">
                    <Database className="h-3 w-3" /> Agmarknet Data
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Fetching real mandi prices...</p>
            <p className="text-xs text-muted-foreground">Querying Agmarknet + weather + AI analysis</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Current Price */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Market Price</p>
                    <p className="text-4xl font-bold text-primary">₹{result.current_price.price_per_kg}/kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Yesterday: ₹{result.current_price.yesterday_price}/kg</p>
                    <div className={`flex items-center gap-1 justify-end ${result.current_price.trend_percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {result.current_price.trend_percentage >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-semibold">{result.current_price.trend_percentage >= 0 ? "+" : ""}{result.current_price.trend_percentage}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sell To Recommendation */}
            {result.sell_to_recommendation && (
              <Card className="border-2 border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-green-800">Best Place to Sell</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">{result.sell_to_recommendation.best_option}</p>
                  <p className="text-sm text-green-700 mt-1">{result.sell_to_recommendation.reason}</p>
                  {result.sell_to_recommendation.expected_extra_earnings_percent > 0 && (
                    <Badge className="mt-2 bg-green-600">+{result.sell_to_recommendation.expected_extra_earnings_percent}% Extra Earnings</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Best Dealers */}
            {result.best_dealers && result.best_dealers.length > 0 && (
              <Card>
                <button className="w-full flex items-center justify-between p-4" onClick={() => setDealersExpanded(!dealersExpanded)}>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" /> Best Dealers & Buyers ({result.best_dealers.length})
                  </CardTitle>
                  {dealersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {dealersExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    {result.best_dealers.map((dealer, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDealerIcon(dealer.type)}
                            <div>
                              <p className="font-semibold text-sm">{dealer.name}</p>
                              <Badge variant="outline" className="text-[10px]">{dealer.type}</Badge>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-primary">₹{dealer.expected_price_per_kg}/kg</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>💰 {dealer.payment_terms}</span>
                          <span>📦 Min: {dealer.minimum_qty_kg}kg</span>
                        </div>
                        <p className="text-xs text-muted-foreground">📞 {dealer.contact_method}</p>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] font-medium text-green-700 mb-1 flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Pros</p>
                            {dealer.pros.map((p, j) => <p key={j} className="text-xs text-green-600">• {p}</p>)}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-medium text-red-700 mb-1 flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> Cons</p>
                            {dealer.cons.map((c, j) => <p key={j} className="text-xs text-red-600">• {c}</p>)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Nearby Markets */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">📍 Nearby Market Prices (APMC)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.nearby_markets.map((m, i) => {
                    const isHighest = m.price_per_kg === Math.max(...result.nearby_markets.map(x => x.price_per_kg));
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{m.name}</span>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${isHighest ? "text-green-600" : ""}`}>₹{m.price_per_kg}/kg</span>
                          <span className="text-xs text-muted-foreground">{m.distance_km} km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Demand Forecast */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  {getDemandIcon(result.demand_forecast.level)}
                  <Badge className={getDemandColor(result.demand_forecast.level)}>{result.demand_forecast.level} DEMAND</Badge>
                  <span className="text-sm text-muted-foreground ml-auto">{result.demand_forecast.duration}</span>
                </div>
                <p className="text-sm font-medium mb-2">{result.demand_forecast.confidence_percent}% Confidence</p>
                <ul className="space-y-1">
                  {result.demand_forecast.reasons.map((r, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-muted-foreground">•</span> {r}</li>)}
                </ul>
              </CardContent>
            </Card>

            {/* Weather Impact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {result.weather_impact.rainfall_mm > 20 ? <CloudRain className="h-5 w-5 text-blue-500" /> : <Sun className="h-5 w-5 text-yellow-500" />} Weather Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Current:</span> {result.weather_impact.current_weather}, {result.weather_impact.current_temp}</p>
                  <p><span className="font-medium">Forecast:</span> {result.weather_impact.forecast_summary}</p>
                  {result.weather_impact.rainfall_mm > 0 && <p><span className="font-medium">Rainfall:</span> {result.weather_impact.rainfall_mm}mm expected</p>}
                  <p className="text-primary font-medium mt-2">{result.weather_impact.impact_statement}</p>
                </div>
              </CardContent>
            </Card>

            {/* Price Prediction */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Expected Price Range</p>
                <p className="text-3xl font-bold">₹{result.price_prediction.expected_min}-{result.price_prediction.expected_max}/kg</p>
                <p className="text-sm text-muted-foreground">{result.price_prediction.timeline}</p>
                <div className={`flex items-center gap-1 mt-1 ${result.price_prediction.trend === "Rising" ? "text-green-600" : result.price_prediction.trend === "Falling" ? "text-red-600" : "text-yellow-600"}`}>
                  {result.price_prediction.trend === "Rising" ? <TrendingUp className="h-4 w-4" /> : result.price_prediction.trend === "Falling" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  <span className="font-medium">{result.price_prediction.trend} ({result.price_prediction.trend_percentage})</span>
                </div>
              </CardContent>
            </Card>

            {/* Negotiation Guide */}
            <Card className="border-2 border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Negotiation Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                    <div>
                      <p className="text-sm font-bold text-red-700 flex items-center gap-1"><XCircle className="h-4 w-4" /> DON'T SELL BELOW</p>
                      <p className="text-xs text-red-600">{result.negotiation_guide.dont_sell_below_reason}</p>
                    </div>
                    <span className="text-xl font-bold text-red-700">₹{result.negotiation_guide.dont_sell_below}/kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <p className="text-sm font-bold text-green-700 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> FAIR PRICE</p>
                      <p className="text-xs text-green-600">{result.negotiation_guide.fair_price_advice}</p>
                    </div>
                    <span className="text-xl font-bold text-green-700">₹{result.negotiation_guide.fair_price_min}-{result.negotiation_guide.fair_price_max}/kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div>
                      <p className="text-sm font-bold text-yellow-700 flex items-center gap-1"><Star className="h-4 w-4" /> BEST CASE</p>
                      <p className="text-xs text-yellow-600">{result.negotiation_guide.best_case_condition}</p>
                    </div>
                    <span className="text-xl font-bold text-yellow-700">₹{result.negotiation_guide.best_case}/kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className={result.recommendation.action === "WAIT" ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-lg font-bold">{result.recommendation.action === "WAIT" ? `WAIT ${result.recommendation.wait_days} DAYS` : "SELL NOW"}</span>
                </div>
                <p className="text-sm mb-1">{result.recommendation.explanation}</p>
                {result.recommendation.best_selling_window && <p className="text-sm font-medium">Best selling window: {result.recommendation.best_selling_window}</p>}
              </CardContent>
            </Card>

            {/* Negotiation Tips */}
            <Card>
              <button className="w-full flex items-center justify-between p-4" onClick={() => setTipsExpanded(!tipsExpanded)}>
                <span className="font-semibold text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Negotiation Tips</span>
                {tipsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {tipsExpanded && (
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {result.negotiation_tips.map((tip, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary font-bold">{i + 1}.</span> {tip}</li>)}
                  </ul>
                </CardContent>
              )}
            </Card>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setScreen("crop"); setResult(null); setSelectedCrop(null); }}>Search Another Crop</Button>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
