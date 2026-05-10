import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation, Language } from "@/lib/krishi-setu/i18n";
import { Tractor, UserCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Landing() {
  const [lang, setLang] = useState<Language>('en');
  const t = useTranslation(lang);
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="relative w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Farm Background */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Language Selection Header */}
        <div className="relative z-10 w-full flex justify-end p-4">
          <Select value={lang} onValueChange={(val: Language) => setLang(val)}>
            <SelectTrigger className="w-[120px] bg-white/20 text-white border-white/40">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
              <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4">
            {t("appTitle")}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 text-center">
            {t("tagline")}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
            {/* Farmer Button */}
            <Button 
              onClick={() => navigate(`/krishi-setu/farmer?lang=${lang}`)}
              className="h-32 flex-1 bg-green-600 hover:bg-green-700 text-white text-2xl rounded-xl shadow-xl flex flex-col items-center justify-center gap-2"
            >
              <Tractor className="h-8 w-8" />
              {t("farmerRole")}
            </Button>

            {/* Labor Button */}
            <Button 
              onClick={() => navigate(`/krishi-setu/labor?lang=${lang}`)}
              className="h-32 flex-1 bg-amber-600 hover:bg-amber-700 text-white text-2xl rounded-xl shadow-xl flex flex-col items-center justify-center gap-2"
            >
              <UserCircle className="h-8 w-8" />
              {t("laborRole")}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
