import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation, Language } from "@/lib/krishi-setu/i18n";
import { skills } from "@/lib/krishi-setu/skills";
import { LaborProfileCard } from "./LaborProfileCard";
import { Loader2, ArrowLeft, MapPin } from "lucide-react";
import { LaborerProfile } from "@/lib/krishi-setu/dummyData";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { AlertTriangle } from "lucide-react";

export default function LaborFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultLang = (searchParams.get("lang") as Language) || "en";
  
  const [lang, setLang] = useState<Language>(defaultLang);
  const [step, setStep] = useState<"location" | "lang" | "form" | "generating" | "result">("location");
  
  const t = useTranslation(lang);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    village: "Captured via GPS",
    lat: 0 as number,
    lng: 0 as number,
    age: "",
    gender: "",
    primarySkill: "",
    secondarySkill: "",
    availableFrom: "",
    availableTo: "",
    shift: "",
    wage: "",
    experience: "",
    languages: [] as string[]
  });

  const [generatedProfile, setGeneratedProfile] = useState<LaborerProfile | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationState, setLocationState] = useState<"pending" | "granted" | "denied">("pending");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocationState("granted");
        setIsLocating(false);
        // Move to next step if there's no language in URL, else skip to form
        if (searchParams.get("lang")) {
          setStep("form");
        } else {
          setStep("lang");
        }
      },
      (err) => {
        console.error(err);
        setLocationState("denied");
        setIsLocating(false);
      },
      { maximumAge: 0 }
    );
  };

  // Skip lang step only if location is already granted (handled inside requestLocation now)

  const handleLangSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    setStep("form");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageCheckbox = (lang: string) => {
    setFormData(prev => {
      if (prev.languages.includes(lang)) {
        return { ...prev, languages: prev.languages.filter(l => l !== lang) };
      }
      return { ...prev, languages: [...prev.languages, lang] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("generating");

    try {
      const profileData = {
        name: formData.name || "Unknown",
        mobile: formData.mobile || "+91 0000000000",
        village: formData.village || "Unknown",
        lat: formData.lat,
        lng: formData.lng,
        age: parseInt(formData.age) || 30,
        gender: formData.gender || "Male",
        primarySkill: formData.primarySkill || "general_labor",
        secondarySkill: formData.secondarySkill || undefined,
        availableFrom: formData.availableFrom || new Date().toISOString(),
        availableTo: formData.availableTo || new Date().toISOString(),
        shift: (formData.shift as any) || "day",
        wage: parseInt(formData.wage) || 500,
        experience: parseInt(formData.experience) || 0,
        languages: formData.languages.length > 0 ? formData.languages : ["Kannada"],
        bio: `${formData.name} is a dedicated worker focusing on ${formData.primarySkill}. Ready to assist farmers efficiently.`,
        verified: false,
        hiredCount: 0,
        rating: 0
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, "workers"), profileData);
      
      setGeneratedProfile({ ...profileData, id: docRef.id } as LaborerProfile);
      setStep("result");
    } catch (err) {
      console.error("Error saving worker:", err);
      // Fallback
      setStep("form");
      alert("Failed to save profile. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-8 min-h-[80vh]">
        
        {step !== "location" && step !== "lang" && (
          <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground" onClick={() => step === 'form' ? navigate('/krishi-setu') : setStep('form')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}

        {step === "location" && (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
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
            </div>
          </div>
        )}

        {step === "lang" && (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
            <h2 className="text-2xl font-bold text-center">{t("selectLanguage")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <Button onClick={() => handleLangSelect("kn")} className="h-24 text-xl bg-primary hover:bg-primary/90">ಕನ್ನಡ 🇮🇳</Button>
              <Button onClick={() => handleLangSelect("hi")} className="h-24 text-xl bg-primary hover:bg-primary/90">हिन्दी 🇮🇳</Button>
              <Button onClick={() => handleLangSelect("en")} className="h-24 text-xl bg-primary hover:bg-primary/90">English</Button>
            </div>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">{t("laborRole")}</h2>
              <Select value={lang} onValueChange={(val: Language) => setLang(val)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("fullName")} *</Label>
                  <Input id="name" required value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">{t("mobileNumber")} *</Label>
                  <Input id="mobile" type="tel" required value={formData.mobile} onChange={(e) => handleInputChange("mobile", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">{t("villageTown")} *</Label>
                  <Input id="village" required value={formData.village} onChange={(e) => handleInputChange("village", e.target.value)} />
                  <p className="text-xs text-green-600 font-medium">Location captured successfully!</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{t("age")} *</Label>
                  <Input id="age" type="number" required value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>{t("gender")} *</Label>
                  <Select required onValueChange={(v) => handleInputChange("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">{t("male")}</SelectItem>
                      <SelectItem value="Female">{t("female")}</SelectItem>
                      <SelectItem value="Other">{t("preferNotToSay")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("primarySkill")} *</Label>
                  <Select required onValueChange={(v) => handleInputChange("primarySkill", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {skills.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s[lang]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("secondarySkill")}</Label>
                  <Select onValueChange={(v) => handleInputChange("secondarySkill", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {skills.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s[lang]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("timePreference")} *</Label>
                  <Select required onValueChange={(v) => handleInputChange("shift", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">{t("dayShift")}</SelectItem>
                      <SelectItem value="night">{t("nightShift")}</SelectItem>
                      <SelectItem value="both">{t("bothShifts")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wage">{t("dailyWage")} *</Label>
                  <Input id="wage" type="number" required value={formData.wage} onChange={(e) => handleInputChange("wage", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp">{t("yearsExperience")} *</Label>
                  <Input id="exp" type="number" required value={formData.experience} onChange={(e) => handleInputChange("experience", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availFrom">{t("availabilityFrom")} *</Label>
                  <Input id="availFrom" type="date" required value={formData.availableFrom} onChange={(e) => handleInputChange("availableFrom", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availTo">{t("availabilityTo")} *</Label>
                  <Input id="availTo" type="date" required value={formData.availableTo} onChange={(e) => handleInputChange("availableTo", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>{t("languagesSpoken")} *</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {['Kannada', 'Hindi', 'English'].map((l) => (
                    <label key={l} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={formData.languages.includes(l)}
                        onChange={() => handleLanguageCheckbox(l)}
                      />
                      <span className="text-sm font-medium">{l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-8 bg-amber-600 hover:bg-amber-700 text-white h-12 text-lg">
              {t("uploadProfile")}
            </Button>
          </form>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
            <Loader2 className="h-16 w-16 text-amber-600 animate-spin" />
            <p className="text-xl font-medium text-amber-600 animate-pulse">{t("buildingProfile")}</p>
          </div>
        )}

        {step === "result" && generatedProfile && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center font-medium border border-green-200">
              Your profile has been created successfully!
            </div>
            <LaborProfileCard profile={generatedProfile} lang={lang} isFarmerView={false} />
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/krishi-setu')}>
              Return Home
            </Button>
          </div>
        )}

      </div>
    </Layout>
  );
}
