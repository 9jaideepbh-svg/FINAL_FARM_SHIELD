import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, Loader2, Leaf, Droplets, Thermometer, Wind, Sprout, AlertTriangle, CloudRain,
  Map, ChevronRight, Activity, FlaskConical, Target, CheckCircle2, Factory, TreePine, XCircle
} from "lucide-react";
import { analyzeSoilWithAI, FetchStatus } from "@/lib/soil-intelligence";
import { useToast } from "@/hooks/use-toast";
import { INDIA_STATES_AND_DISTRICTS } from "@/lib/india-states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { m, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function SoilIntelligence() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showFallback, setShowFallback] = useState(true);
  const [apiStatuses, setApiStatuses] = useState<Record<string, FetchStatus>>({});
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const bgGradient = useMotionTemplate`radial-gradient(800px circle at ${smoothX}px ${smoothY}px, rgba(34,197,94,0.15), transparent 80%)`;

  const startAnalysis = async (lat: number, lon: number, locationName: string) => {
    setLoading(true);
    setApiStatuses({});
    setCoordinates({ lat, lon });
    setLoadingStep("Connecting to satellites & weather models...");
    
    try {
      const data = await analyzeSoilWithAI(lat, lon, locationName, (statusUpdate) => {
        setApiStatuses(statusUpdate);
        
        // Dynamically update the loading step text based on what's active
        const pendingApis = Object.values(statusUpdate).filter(s => s.status === 'pending');
        if (pendingApis.length > 0) {
          setLoadingStep(`Running: ${pendingApis[0].apiName}...`);
        } else {
          setLoadingStep("Compiling final agro-analysis report...");
        }
      });
      
      setResult(data);

      toast({
        title: "Analysis Complete",
        description: `Soil health score: ${data.healthScore.score}/100`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Analysis Failed",
        description: "Could not fetch satellite data or generate AI report.",
        variant: "destructive",
      });
      setShowFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Location Access",
        description: "Please grant location access to fetch automatic satellite data.",
      });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          startAnalysis(position.coords.latitude, position.coords.longitude, "Your Location");
        },
        (error) => {
          console.warn("Geolocation denied or error", error);
          toast({
            title: "Location Denied",
            description: "Could not access location. Please select manually.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Location Unavailable",
        description: "Your browser does not support geolocation.",
        variant: "destructive"
      });
    }
  };

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!district || !stateName) return;
    
    setLoading(true);
    setLoadingStep("Resolving location coordinates...");
    
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(district + ", " + stateName + ", India")}`);
      const geoData = await geoRes.json();
      
      if (geoData && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        await startAnalysis(lat, lon, `${district}, ${stateName}`);
      } else {
        throw new Error("Location not found");
      }
    } catch (err) {
      toast({
        title: "Location Error",
        description: "Could not find coordinates for this district/state.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
        <div className="container py-24 flex flex-col items-center justify-center min-h-[75vh] max-w-md mx-auto text-center relative z-10">
          <m.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <m.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full" 
            />
            <div className="h-24 w-24 rounded-full border border-primary/20 bg-background/50 backdrop-blur-xl flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(var(--primary),0.2)]">
              <FlaskConical className="h-10 w-10 text-primary" />
            </div>
          </m.div>
          <m.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-2 tracking-tight"
          >
            Soil Intelligence
          </m.h2>
          <m.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-primary font-medium text-sm mb-8 tracking-wide uppercase"
          >
            {loadingStep}
          </m.p>

          <m.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <Card className="w-full border-border/50 shadow-2xl bg-background/60 backdrop-blur-2xl text-left rounded-3xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  Live Sat-Link Status
                </CardTitle>
                <CardDescription className="text-xs">Real-time agricultural data stream</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {Object.values(apiStatuses).map((api, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1">
                    <span className="font-medium text-muted-foreground">{api.apiName}</span>
                    <div className="flex items-center gap-2">
                      {api.status === 'pending' && (
                        <span className="flex items-center gap-1.5 text-blue-500 font-medium text-xs">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Fetching...
                        </span>
                      )}
                      {api.status === 'success' && (
                        <span className="flex items-center gap-1.5 text-emerald-500 font-medium text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Success
                        </span>
                      )}
                      {api.status === 'timeout' && (
                        <span className="flex items-center gap-1.5 text-amber-500 font-medium text-xs" title={api.details}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Timed Out
                        </span>
                      )}
                      {api.status === 'failed' && (
                        <span className="flex items-center gap-1.5 text-red-500 font-medium text-xs" title={api.details}>
                          <XCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </m.div>
        </div>
      </Layout>
    );
  }

  if (showFallback && !result) {
    return (
      <Layout>
        <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
        <div className="container py-20 max-w-lg relative z-10">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          >
            <Card className="border-border/50 shadow-2xl shadow-primary/5 bg-background/60 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-emerald-500" />
              <CardHeader className="text-center pb-6 pt-10">
                <m.div 
                  whileHover={{ scale: 1.05 }}
                  className="mx-auto bg-gradient-to-br from-primary/20 to-primary/5 w-20 h-20 flex items-center justify-center rounded-2xl rotate-3 mb-6 shadow-inner border border-primary/20"
                >
                  <MapPin className="h-10 w-10 text-primary -rotate-3" />
                </m.div>
                <CardTitle className="text-3xl font-bold tracking-tight">Soil Intelligence</CardTitle>
                <CardDescription className="text-base mt-2">
                  Initialize location link to fetch real-time orbital agricultural data.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <Button 
                  type="button" 
                  onClick={handleCurrentLocation} 
                  className="w-full mb-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 rounded-xl h-12 flex items-center gap-2 group"
                >
                  <MapPin className="h-5 w-5 group-hover:animate-bounce" />
                  Auto-Detect Location
                </Button>
                
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-medium">
                    <span className="bg-background px-4 text-muted-foreground rounded-full">Manual Override</span>
                  </div>
                </div>

                <form onSubmit={handleFallbackSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 ml-1">Select State</label>
                    <select 
                      required 
                      value={stateName} 
                      onChange={e => { setStateName(e.target.value); setDistrict(""); }}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                    >
                      <option value="" disabled>Choose territory...</option>
                      {Object.keys(INDIA_STATES_AND_DISTRICTS).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 ml-1">Select District</label>
                    <select 
                      required 
                      value={district} 
                      onChange={e => setDistrict(e.target.value)}
                      disabled={!stateName}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    >
                      <option value="" disabled>Choose sector...</option>
                      {stateName && INDIA_STATES_AND_DISTRICTS[stateName].map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full mt-4 h-12 rounded-xl" 
                    variant="secondary"
                  >
                    Commence Analysis
                  </Button>
                </form>
              </CardContent>
            </Card>
          </m.div>
        </div>
      </Layout>
    );
  }

  if (!result) return null;

  return (
    <Layout>
      <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
      <div className="container py-10 md:py-16 max-w-7xl relative z-10">
        <m.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 backdrop-blur-md rounded-full px-3 py-1">
              Mission Success
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                Soil Intelligence
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-xl leading-relaxed">
              Advanced agro-analysis generated using orbital multispectral data and AI models.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="rounded-full h-12 px-6 border-border/50 bg-background/50 backdrop-blur-xl hover:bg-background/80 hover:scale-105 transition-all shadow-sm"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Scan New Sector
          </Button>
        </m.div>

        <m.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          
          {/* Card 1: Location & Soil Type */}
          <m.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
            <Card className="h-full border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl shadow-green-900/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full blur-[40px] group-hover:bg-green-500/30 transition-colors duration-500" />
              
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 ring-1 ring-green-500/20">
                    <Map className="h-5 w-5" />
                  </div>
                  Geospatial Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-[11px]">Sector Profile</p>
                  <p className="font-bold text-xl">{result.locationAndType.locationName}</p>
                  {coordinates && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5 font-mono">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                    </p>
                  )}
                </div>
                
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div 
                    className="h-12 w-12 rounded-full ring-2 ring-background shadow-lg" 
                    style={{ backgroundColor: result.locationAndType.colorIndicator || '#8B4513' }}
                  />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Morphology</p>
                    <p className="font-bold">{result.locationAndType.soilClassification}</p>
                  </div>
                </div>
                
                <Badge variant="secondary" className="w-full justify-center py-2 text-sm rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-none">
                  Texture: {result.locationAndType.soilTexture}
                </Badge>
              </CardContent>
            </Card>
          </m.div>

          {/* Card 2: Soil Health Score */}
          <m.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
            <Card className="h-full border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl shadow-blue-900/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] group-hover:bg-blue-500/30 transition-colors duration-500" />
              
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20">
                    <Activity className="h-5 w-5" />
                  </div>
                  Vitality Index
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4 relative z-10">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Global Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{result.healthScore.score}</span>
                    </div>
                  </div>
                  <div className="relative h-16 w-16">
                     <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                       <path className="text-blue-500/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                       <path className="text-blue-500" strokeDasharray={`${result.healthScore.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                     </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">pH Level</p>
                    <p className="font-bold text-lg">{result.healthScore.phLevel}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Nitrogen</p>
                    <p className={`font-bold text-sm ${result.healthScore.nitrogenStatus === "Deficient" ? "text-red-500" : "text-emerald-500"}`}>
                      {result.healthScore.nitrogenStatus}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">
                    <span>Sand {result.healthScore.sandRatio}%</span>
                    <span>Clay {result.healthScore.clayRatio}%</span>
                  </div>
                  <div className="w-full flex h-3 rounded-full overflow-hidden bg-background/50 ring-1 ring-border/50">
                    <m.div initial={{ width: 0 }} animate={{ width: `${result.healthScore.sandRatio}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-yellow-400" />
                    <m.div initial={{ width: 0 }} animate={{ width: `${result.healthScore.clayRatio}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-orange-700" />
                    <m.div initial={{ width: 0 }} animate={{ width: `${100 - result.healthScore.sandRatio - result.healthScore.clayRatio}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-stone-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>

          {/* Card 3: Best Crops */}
          <m.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
            <Card className="h-full border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl shadow-orange-900/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-[40px] group-hover:bg-orange-500/30 transition-colors duration-500" />
              
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20">
                    <Target className="h-5 w-5" />
                  </div>
                  Optimal Cultivation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 relative z-10">
                {result.bestCrops.map((crop: any, idx: number) => (
                  <m.div 
                    key={idx} 
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${crop.isBestMatch ? 'bg-orange-500/10 border border-orange-500/20 ring-1 ring-orange-500/10 shadow-sm' : 'bg-white/5 border border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${crop.isBestMatch ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' : 'bg-background/80'}`}>
                        {idx === 0 ? <TreePine className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{crop.name}</p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{crop.season}</p>
                      </div>
                    </div>
                    <Badge variant={crop.isBestMatch ? "default" : "secondary"} className={`rounded-lg ${crop.isBestMatch ? 'bg-orange-500 hover:bg-orange-600' : ''}`}>
                      {crop.expectedYield}
                    </Badge>
                  </m.div>
                ))}
              </CardContent>
            </Card>
          </m.div>

          {/* Card 4: Weather & Rain */}
          <m.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
            <Card className="h-full border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl shadow-purple-900/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] group-hover:bg-purple-500/30 transition-colors duration-500" />
              
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20">
                    <CloudRain className="h-5 w-5" />
                  </div>
                  Meteorological Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4 relative z-10">
                <div className="flex gap-3">
                  <div className="flex-1 bg-gradient-to-br from-purple-500/10 to-transparent p-4 rounded-2xl border border-purple-500/20">
                    <p className="text-[11px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold mb-1">Moisture Trend</p>
                    <p className="font-bold flex items-center gap-1.5 text-sm">
                      <Droplets className="h-4 w-4 text-purple-500" />
                      {result.weatherForecast.soilMoistureTrend}
                    </p>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-cyan-500/10 to-transparent p-4 rounded-2xl border border-cyan-500/20">
                    <p className="text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold mb-1">Best Plant Day</p>
                    <p className="font-bold text-sm truncate" title={result.weatherForecast.bestDaysToPlant}>{result.weatherForecast.bestDaysToPlant}</p>
                  </div>
                </div>

                {result.weatherForecast.rainRiskWarnings && (
                  <Alert variant="destructive" className="py-3 bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium ml-2">{result.weatherForecast.rainRiskWarnings}</AlertDescription>
                  </Alert>
                )}

                <div className="pt-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[11px] uppercase tracking-wider font-bold mb-3 flex items-center justify-between text-muted-foreground">
                    <span>7-Day Precipitation</span>
                    <span>(mm)</span>
                  </p>
                  <div className="flex justify-between items-end h-20 gap-2">
                    {result.weatherForecast.sevenDayRainfall.map((day: any, i: number) => {
                      const height = Math.min(day.rainMm * 2, 100);
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group/bar">
                          <div className="w-full relative flex justify-center items-end h-full">
                            <m.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 0.8, delay: 0.5 + (i * 0.1) }}
                              className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-sm opacity-70 group-hover/bar:opacity-100 transition-opacity" 
                              style={{ minHeight: '4px' }}
                            >
                              <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none transition-opacity">
                                {day.rainMm}mm
                              </div>
                            </m.div>
                          </div>
                          <span className="text-[10px] mt-2 text-muted-foreground font-medium">{day.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>

          {/* Card 5: Fertilizer Plan */}
          <m.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full md:col-span-2 lg:col-span-1">
            <Card className="h-full border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl shadow-teal-900/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-[40px] group-hover:bg-teal-500/30 transition-colors duration-500" />
              
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
                    <Factory className="h-5 w-5" />
                  </div>
                  Nutrient Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4 relative z-10">
                <div className="bg-gradient-to-br from-teal-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-teal-600 dark:text-teal-400 mb-1">Target NPK Ratio</p>
                    <p className="text-3xl font-black text-foreground">{result.fertilizerPlan.npkRatio}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <FlaskConical className="h-6 w-6 text-teal-500" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">Recommended Compounds</p>
                  <div className="flex flex-wrap gap-2">
                    {result.fertilizerPlan.recommendedFertilizers.map((fert: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg py-1 px-3">
                        {fert}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Dosage</p>
                    <p className="text-sm font-bold line-clamp-2" title={result.fertilizerPlan.dosagePerAcre}>{result.fertilizerPlan.dosagePerAcre}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Schedule</p>
                    <p className="text-sm font-bold line-clamp-2" title={result.fertilizerPlan.applicationSchedule}>{result.fertilizerPlan.applicationSchedule}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>

          {/* Card 6: Improvement Tips */}
          <m.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full md:col-span-full lg:col-span-1">
            <Card className="h-full border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl shadow-emerald-900/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] group-hover:bg-emerald-500/30 transition-colors duration-500" />
              
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                    <Leaf className="h-5 w-5" />
                  </div>
                  Remediation Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4 relative z-10 flex flex-col h-[calc(100%-4rem)] justify-between">
                <div>
                  {result.improvementTips.warnings && result.improvementTips.warnings.length > 0 && (
                    <m.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-500/20 text-sm mb-5 shadow-sm"
                    >
                      <span className="font-bold flex items-center gap-2 mb-2 tracking-wide uppercase text-[11px]">
                        <AlertTriangle className="h-4 w-4" /> Critical Warning
                      </span>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.improvementTips.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </m.div>
                  )}

                  <ul className="space-y-4">
                    {result.improvementTips.actionableTips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0 shrink-0" />
                        <span className="font-medium text-foreground/80 leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1">Estimated Recovery Timeline</p>
                  <p className="font-bold text-lg">{result.improvementTips.recoveryTimeline}</p>
                </div>
              </CardContent>
            </Card>
          </m.div>

        </m.div>
      </div>
    </Layout>
  );
}
