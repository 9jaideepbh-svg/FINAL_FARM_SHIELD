import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation, Language } from "@/lib/krishi-setu/i18n";
import { MapPin, Search, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { LaborerProfile, getDistanceFromLatLonInKm } from "@/lib/krishi-setu/dummyData";
import { LaborProfileCard } from "./LaborProfileCard";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { skills } from "@/lib/krishi-setu/skills";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function FarmerFlow() {
  const [searchParams] = useSearchParams();
  const defaultLang = (searchParams.get("lang") as Language) || "en";
  const [lang] = useState<Language>(defaultLang);
  const t = useTranslation(lang);

  const [locationState, setLocationState] = useState<"pending" | "granted" | "denied">("pending");
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Filters
  const [radius, setRadius] = useState(25);
  const [skillFilter, setSkillFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [sortOption, setSortOption] = useState("distance");

  const [filteredLaborers, setFilteredLaborers] = useState<LaborerProfile[]>([]);

  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState("granted");
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setLocationState("denied");
        setIsLocating(false);
      },
      { maximumAge: 0 }
    );
  };

  const skipLocation = () => {
    // Default to central Karnataka (Hubli area) so dummy data works
    setUserLocation({ lat: 15.3647, lng: 75.1240 }); 
    setLocationState("granted");
  };

  const [allWorkers, setAllWorkers] = useState<LaborerProfile[]>([]);

  useEffect(() => {
    if (locationState !== "granted" || !userLocation) return;
    
    const fetchWorkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workers"));
        const workersData: LaborerProfile[] = [];
        querySnapshot.forEach((doc) => {
          workersData.push({ id: doc.id, ...doc.data() } as LaborerProfile);
        });
        setAllWorkers(workersData);
      } catch (err) {
        console.error("Error fetching workers", err);
      }
    };
    fetchWorkers();
  }, [locationState, userLocation]);

  useEffect(() => {
    if (locationState !== "granted" || !userLocation) return;

    let result = allWorkers.map(laborer => ({
      ...laborer,
      distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, laborer.lat, laborer.lng)
    }));

    // Filter by radius
    result = result.filter(l => l.distance! <= radius);

    // Filter by skill
    if (skillFilter !== "all") {
      result = result.filter(l => l.primarySkill === skillFilter || l.secondarySkill === skillFilter);
    }

    // Filter by shift
    if (shiftFilter !== "all") {
      result = result.filter(l => l.shift === shiftFilter || l.shift === 'both');
    }

    // Sorting
    if (sortOption === "distance") {
      result.sort((a, b) => a.distance! - b.distance!);
    } else if (sortOption === "wage") {
      result.sort((a, b) => a.wage - b.wage);
    } else if (sortOption === "experience") {
      result.sort((a, b) => b.experience - a.experience);
    }

    setFilteredLaborers(result);
  }, [allWorkers, locationState, userLocation, radius, skillFilter, shiftFilter, sortOption]);

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  if (locationState === "pending" || locationState === "denied") {
    return (
      <Layout>
        <div className="container min-h-[80vh] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-xl border text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t("locationRequired")}</h2>
            
            {locationState === "denied" ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3 text-left">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">{t("enableLocation")}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t("locationReason")}
              </p>
            )}

            <Button 
              size="lg" 
              className="w-full h-14 text-lg" 
              onClick={requestLocation}
              disabled={isLocating}
            >
              {isLocating ? "Locating..." : t("allowLocation")}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground" 
              onClick={skipLocation}
            >
              Skip (Use Default Location)
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 bg-muted/20 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Labor Discovery</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Showing workers near you
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card p-4 rounded-xl border shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" /> {t("radius")} ({radius} km)
            </label>
            <Slider
              value={[radius]}
              onValueChange={(val) => setRadius(val[0])}
              max={100}
              min={5}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("filterBySkill")}</label>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger><SelectValue placeholder="All Skills" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {skills.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s[lang]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("filterByShift")}</label>
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger><SelectValue placeholder="Any Shift" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Shift</SelectItem>
                <SelectItem value="day">{t("dayShift")}</SelectItem>
                <SelectItem value="night">{t("nightShift")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> {t("sortByDistance")}
            </label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">{t("nearestFirst")}</SelectItem>
                <SelectItem value="wage">{t("lowestWage")}</SelectItem>
                <SelectItem value="experience">Most Experienced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feed */}
        {filteredLaborers.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed">
            <p className="text-lg text-muted-foreground">{t("noLaborersFound")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaborers.map(laborer => (
              <LaborProfileCard 
                key={laborer.id} 
                profile={laborer} 
                lang={lang} 
                onCall={handleCall}
                isFarmerView={true}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
