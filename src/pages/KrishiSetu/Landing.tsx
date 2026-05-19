import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTranslation, Language } from "@/lib/krishi-setu/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./Landing.css";

export default function Landing() {
  const [lang, setLang] = useState<Language>('en');
  const t = useTranslation(lang);
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="krishi-setu-page">
        {/* Language Selection Header */}
        <div className="absolute top-4 right-4 z-[20]">
          <Select value={lang} onValueChange={(val: Language) => setLang(val)}>
            <SelectTrigger className="w-[120px] bg-black/40 text-white border-white/20 backdrop-blur-md">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
              <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="main-container">
          <h1 className="brand-title">Krishi Setu</h1>
          <p className="brand-subtitle">{t("tagline") || "A powerful connection for a stronger agricultural future."}</p>

          <div className="cards-wrapper">
            {/* Farmer Card */}
            <div 
              className="action-card farmer-card" 
              onClick={() => navigate(`/krishi-setu/farmer?lang=${lang}`)}
            >
              <div className="card-header-text">EMPOWER YOUR OPERATION</div>
              <div className="icon-container">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 55H35V65H20V55Z" fill="#00ff66"/>
                  <path d="M35 45H55V65H35V45Z" fill="#00ff66" opacity="0.8"/>
                  <circle cx="30" cy="75" r="12" stroke="#00ff66" stroke-width="5" fill="#141914"/>
                  <circle cx="70" cy="70" r="18" stroke="#00ff66" stroke-width="5" fill="#141914"/>
                  <path d="M55 50H70V55H55V50Z" fill="#00ff66"/>
                  <path d="M5 30Q15 40 15 60" stroke="#00ff66" stroke-width="3" stroke-linecap="round"/>
                  <path d="M95 30Q85 40 85 60" stroke="#00ff66" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </div>
              <div className="card-footer-text">{t("farmerRole").toUpperCase()}</div>
            </div>

            {/* Labor Card */}
            <div 
              className="action-card labor-card" 
              onClick={() => navigate(`/krishi-setu/labor?lang=${lang}`)}
            >
              <div className="card-header-text">JOIN THE FORCE</div>
              <div className="icon-container">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 70L70 30" stroke="#ff9900" stroke-width="6" stroke-linecap="round"/>
                  <path d="M70 30L75 25M65 35L60 40" stroke="#ff9900" stroke-width="6"/>
                  <path d="M70 70L30 30" stroke="#ff9900" stroke-width="6" stroke-linecap="round"/>
                  <path d="M25 25C35 25 40 35 40 35" stroke="#ff9900" stroke-width="5" stroke-linecap="round"/>
                  <circle cx="50" cy="50" r="14" fill="#ff9900"/>
                  <rect x="44" y="50" width="12" height="18" rx="3" fill="#151005" stroke="#ff9900" stroke-width="2"/>
                </svg>
              </div>
              <div className="card-footer-text">{t("laborRole").toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="quick-actions-panel">
          <div className="action-item">
            <button className="circle-btn btn-search">
              <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/></svg>
            </button>
            <span>SEARCH</span>
          </div>
          <div className="action-item">
            <button className="circle-btn btn-support">
              <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
            </button>
            <span>SUPPORT</span>
          </div>
          {/* Settings option removed as per user request */}
        </div>

        {/* Bottom Ticker Banner */}
        <div className="ticker-wrap">
          <div className="ticker">
            <div className="ticker-item">MARKET: RICE <span className="highlight-green">+4%</span></div>
            <div className="ticker-item">|</div>
            <div className="ticker-item"><span className="highlight-orange">NEW LABOR JOBS OPEN IN PUNJAB</span></div>
            <div className="ticker-item">|</div>
            <div className="ticker-item">WEATHER: RAIN EXPECTED IN MAHARASHTRA</div>
            <div className="ticker-item">|</div>
            <div className="ticker-item">GLOBAL CROP NEWS: WHEAT HARVEST UP</div>
            <div className="ticker-item">|</div>
            <div className="ticker-item">MARKET: RICE <span className="highlight-green">+4%</span></div>
            <div className="ticker-item">|</div>
            <div className="ticker-item"><span className="highlight-orange">NEW LABOR JOBS OPEN IN PUNJAB</span></div>
            <div className="ticker-item">|</div>
            <div className="ticker-item">WEATHER: RAIN EXPECTED IN MAHARASHTRA</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
