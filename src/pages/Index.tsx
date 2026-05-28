import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { m, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useUser, useClerk } from "@clerk/clerk-react";
import LightRays from "@/components/home/LightRays";
import SplashCursor from "@/components/home/SplashCursor";
import { VoiceNavigation } from "@/components/voice/VoiceNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Sparkles, 
  Mic, 
  Home,
  Network,
  Newspaper,
  HeartPulse,
  Landmark,
  TrendingUp,
  Cpu,
  CloudSun,
  Droplet,
  UserPlus,
  LogIn,
  Menu,
  X,
  Check,
  Camera,
  Shield,
  Zap,
  Globe,
  User,
  History,
  LogOut,
  Leaf,
  ArrowRight,
  HelpCircle
} from "lucide-react";

const isLowEnd = typeof navigator !== 'undefined' && 
  (navigator.hardwareConcurrency <= 4 || (navigator as any).deviceMemory <= 4);

// ==========================================
// Sub-component: Premium GSAP Split Preloader
// ==========================================
function PremiumPreloader({ onComplete }: { onComplete: () => void }) {
  const [activePhrase, setActivePhrase] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        onComplete();
      }
    });

    // Animate loader bar over 6.0 seconds
    tl.to("#progressBar", {
      scaleX: 1,
      transformOrigin: "left center",
      duration: 6.0,
      ease: "power1.inOut"
    }, 0);

    const segments = [
      { id: "#phrase1", index: 1, start: 0.0, length: 1.2 },
      { id: "#phrase2", index: 2, start: 1.2, length: 1.2 },
      { id: "#phrase3", index: 3, start: 2.4, length: 1.8 },
      { id: "#phrase4", index: 4, start: 4.2, length: 1.8 }
    ];

    segments.forEach((seg) => {
      tl.to({}, {
        onStart: () => setActivePhrase(seg.index),
        duration: 0.05
      }, seg.start);

      tl.fromTo(seg.id,
        { "--gy": "160%" },
        {
          "--gy": "-60%",
          duration: seg.length,
          ease: "none"
        },
        seg.start
      );
    });

    // Smooth exit animations beginning at exactly 6.0s
    tl.to("#loaderContent", {
      opacity: 0,
      scale: 0.94,
      duration: 0.4,
      ease: "power2.out"
    }, 6.0);

    tl.to("#loaderLightRays", {
      opacity: 0,
      duration: 0.45,
      ease: "power2.out"
    }, 6.0);

    // Split-panel slide reveal
    tl.to("#loaderPanelLeft", {
      xPercent: -100,
      duration: 1.2,
      ease: "power3.inOut"
    }, 6.15);

    tl.to("#loaderPanelRight", {
      xPercent: 100,
      duration: 1.2,
      ease: "power3.inOut"
    }, 6.15);

    tl.to("#loaderWrapper", {
      pointerEvents: "none",
      duration: 0.1
    }, 6.1);

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  return (
    <div className="loader-wrapper" id="loaderWrapper" style={{ backgroundColor: "transparent" }}>
      <div 
        id="loaderPanelLeft" 
        className="loader-panel-left" 
        style={{ willChange: "transform" }}
      />
      <div 
        id="loaderPanelRight" 
        className="loader-panel-right" 
        style={{ willChange: "transform" }}
      />

      {/* Volumetric background rays behind loading text */}
      <div id="loaderLightRays" className="absolute inset-0 z-[2] opacity-75 pointer-events-none">
        <LightRays
          raysOrigin="bottom-center"
          raysColor="#fffafb"
          raysSpeed={1.5}
          lightSpread={2}
          rayLength={3}
          saturation={1.5}
          fadeDistance={1.7}
          pulsating={true}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.06}
          distortion={0.1}
        />
      </div>

      <div id="loaderContent" className="loader-content relative z-10">
        <div className="progress-container">
          <div className="progress-bar" id="progressBar" />
        </div>

        <div className="text-display-area font-inter">
          <h1
            className={`headline ${activePhrase === 1 ? "active" : ""}`}
            id="phrase1"
          >
            Welcome to Farm Shield
          </h1>
          <h1
            className={`headline ${activePhrase === 2 ? "active" : ""}`}
            id="phrase2"
          >
            Packed with features Such As...
          </h1>
          <h1
            className={`headline ${activePhrase === 3 ? "active" : ""}`}
            id="phrase3"
          >
            AI Plant Diagnosis — Price Forecasting — Farmer LinkedIn
          </h1>
          <h1
            className={`headline ${activePhrase === 4 ? "active" : ""}`}
            id="phrase4"
          >
            With 13+ Indian languages One Place For Farmers
          </h1>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Sub-component: Framer Motion FAQ Accordion
// ==========================================
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer group"
      >
        <span className="font-fustat font-bold text-white text-base md:text-lg transition-colors group-hover:text-emerald-400 pr-4">
          {question}
        </span>
        <m.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-white/60 group-hover:text-white flex-shrink-0"
        >
          <ChevronDown size={20} />
        </m.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-gray-400 text-sm md:text-base leading-relaxed border-t border-white/5 pt-4">
              {answer}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Main Page Component
// ==========================================
export default function Index() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [preloaderActive, setPreloaderActive] = useState(() => {
    return !sessionStorage.getItem("hasShownPreloader");
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Navigation items mapping exactly to physical routes with icons & description tags
  const navItems = [
    { id: "Home", label: "Home", icon: Home, desc: "AI agricultural telemetry command center", color: "from-emerald-400 to-teal-500", to: "/" },
    { id: "Krishi Setu", label: "Krishi Setu", icon: Network, desc: "Consult directly with verified agronomists", color: "from-blue-400 to-indigo-500", to: "/krishi-setu" },
    { id: "Kisan Times", label: "Kisan Times", icon: Newspaper, desc: "Real-time crop news, trends & bulletins", color: "from-amber-400 to-orange-500", to: "/farmer-blog" },
    { id: "Diagnosis", label: "Diagnosis", icon: HeartPulse, desc: "Scan plant leaves for pathogen prognosis", color: "from-red-400 to-rose-500", to: "/diagnosis" },
    { id: "Government Schemes", label: "Government Schemes", icon: Landmark, desc: "Sarkari grants, subsidies & local benefits", color: "from-violet-400 to-purple-500", to: "/schemes" },
    { id: "Price Forecasting", label: "Price Forecasting", icon: TrendingUp, desc: "Market pricing forecasts & price trends", color: "from-yellow-400 to-amber-500", to: "/price-forecast" },
    { id: "Crop Simulator", label: "Crop Simulator", icon: Cpu, desc: "Interactive growth simulation sandbox", color: "from-cyan-400 to-blue-500", to: "/simulator" },
    { id: "Weather", label: "Weather", icon: CloudSun, desc: "Regional rainfall & humidity telemetry", color: "from-sky-400 to-indigo-500", to: "/weather" },
    { id: "Soil Intelligence", label: "Soil Intelligence", icon: Droplet, desc: "N-P-K readings & irrigation calibration", color: "from-emerald-500 to-green-600", to: "/soil-intelligence" },
  ];

  // Dynamically map pathname to active tab to synchronize underline indicator
  const getActiveTabFromPath = (path: string) => {
    if (path === "/" || path === "") return "Home";
    if (path.startsWith("/krishi-setu")) return "Krishi Setu";
    if (path.startsWith("/farmer-blog")) return "Kisan Times";
    if (path.startsWith("/diagnosis")) return "Diagnosis";
    if (path.startsWith("/schemes")) return "Government Schemes";
    if (path.startsWith("/price-forecast")) return "Price Forecasting";
    if (path.startsWith("/simulator")) return "Crop Simulator";
    if (path.startsWith("/weather")) return "Weather";
    if (path.startsWith("/soil-intelligence")) return "Soil Intelligence";
    return "Home";
  };
  const activeTab = getActiveTabFromPath(location.pathname);

  // Initialize SEO header metadata & active viewport settings
  useEffect(() => {
    document.title = "Farm Shield - AI Crop Diagnosis & Digital Agriculture Platform";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Farm Shield is a comprehensive digital agricultural ecosystem designed to protect crops, optimize yields, and connect farming communities across India using advanced AI plant disease diagnosis, market price forecasting, Krishi Setu labor marketplace, and automated government schemes."
      );
    }
  }, []);

  return (
    <>
      {preloaderActive && (
        <PremiumPreloader
          onComplete={() => {
            sessionStorage.setItem("hasShownPreloader", "true");
            setPreloaderActive(false);
          }}
        />
      )}

      <main className="relative w-full min-h-screen overflow-x-hidden flex flex-col items-center select-none font-schibsted selection:bg-white/20 selection:text-white bg-transparent">
        {/* Primary Landing Content Wrapper */}
        <div className="relative z-10 w-full max-w-[1580px] px-6 md:px-10 xl:px-14 flex flex-col justify-between py-4">
          
          {/* ==========================================
              Premium Glassmorphic Navigation Bar
             ========================================== */}
          <nav className="w-full relative py-6 font-schibsted bg-transparent z-25">
            {/* Logo element with brand name matching specs - DESKTOP LAYOUT ONLY */}
            <div className="hidden lg:flex items-center justify-center w-full relative">
              {/* Logo (Left aligned absolutely) */}
              <Link to="/" className="absolute left-0 flex items-center gap-3 select-none cursor-pointer">
                <img 
                  src="/favicon.ico" 
                  alt="Farm Shield Logo" 
                  className="w-10 h-10 object-contain rounded-xl shadow-sm transition-transform hover:scale-105 duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=120";
                  }}
                />
                <span className="text-[23px] font-bold tracking-tight text-gray-900 font-fustat">
                  Farm Shield
                </span>
              </Link>

              {/* Core Navigation Items (True Centered) */}
              <div className="flex items-center gap-7 text-[14.5px] font-medium text-gray-800 font-inter">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap ${
                      activeTab === item.id 
                        ? "text-black font-semibold" 
                        : "opacity-75 hover:opacity-100 hover:text-black"
                    }`}
                  >
                    {item.label}
                    {activeTab === item.id && (
                      <m.div 
                        layoutId="activeHeaderTab"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* Clerk User Avatar (Right aligned absolutely) */}
              <div className="absolute right-0 flex items-center gap-3">
                {!isLoaded ? (
                  <div className="h-9 w-9 bg-black/5 animate-pulse rounded-full" />
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 bg-white/45 border border-white/60 shadow-sm hover:shadow-md hover:bg-white/60 transition-all duration-300 rounded-full py-1 pl-1 pr-3 backdrop-blur-[6px] cursor-pointer focus:outline-none select-none">
                        {user.imageUrl ? (
                          <img 
                            src={user.imageUrl} 
                            alt="User Avatar" 
                            className="w-7 h-7 rounded-full border border-black/10"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-600/25 flex items-center justify-center text-[10px] font-bold text-emerald-800">
                            {user.firstName?.charAt(0) || "F"}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-black/85">
                          {user.firstName || "Farmer"}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] bg-white/85 backdrop-blur-2xl p-2.5 mt-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <DropdownMenuItem 
                        onClick={() => navigate("/profile")} 
                        className="cursor-pointer rounded-xl py-2 px-3 text-xs font-semibold text-gray-700 hover:text-emerald-950 focus:bg-emerald-500/10 focus:text-emerald-900 transition-colors flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-emerald-700" />
                        <span>Manage Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/history")} 
                        className="cursor-pointer rounded-xl py-2 px-3 text-xs font-semibold text-gray-700 hover:text-emerald-950 focus:bg-emerald-500/10 focus:text-emerald-900 transition-colors flex items-center gap-2"
                      >
                        <History className="h-4 w-4 text-emerald-700" />
                        <span>History</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1.5 bg-black/5" />
                      <DropdownMenuItem 
                        onClick={() => signOut()} 
                        className="cursor-pointer rounded-xl py-2 px-3 text-xs font-semibold text-red-600 hover:text-red-700 focus:bg-red-500/10 focus:text-red-700 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link 
                    to="/auth" 
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black/75 hover:text-white hover:bg-black transition-all bg-white/45 border border-white/60 shadow-sm backdrop-blur-[6px] rounded-full"
                  >
                    Log In
                  </Link>
                )}
              </div>
            </div>

            {/* MOBILE LAYOUT ONLY - Keep logo in center, remove Sign Up/Log In, keep Liquid Glass corner three-line menu tab */}
            <div className="flex lg:hidden items-center justify-between w-full px-2">
              {/* Left Slot: Empty container to balance centering */}
              <div className="w-12 h-12" />

              {/* Center Logo & Brand */}
              <Link to="/" className="flex items-center gap-2 select-none cursor-pointer">
                <img 
                  src="/favicon.ico" 
                  alt="Farm Shield Logo" 
                  className="w-9 h-9 object-contain rounded-lg shadow-sm flex-shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=120";
                  }}
                />
                <span className="text-[20px] font-semibold tracking-[-1.2px] text-black whitespace-nowrap">
                  Farm Shield
                </span>
              </Link>

              {/* Right Slot: Liquid Glass Three-line menu Trigger button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="liquid-glass-btn !min-w-0 !w-11 !h-11 !p-0 !rounded-full flex items-center justify-center cursor-pointer shadow-md text-white transition-all duration-300 ring-1 ring-white/20 active:scale-95 group relative overflow-hidden"
                aria-label="Toggle Menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <m.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={20} className="text-white" />
                    </m.div>
                  ) : (
                    <m.div
                      key="hamburger"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
                    </m.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* MOBILE FLOATING LIQUID GLASS MENU PANEL - Render when mobileMenuOpen is active */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <m.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="absolute top-[88px] left-0 right-0 mx-auto w-[calc(100%-16px)] max-w-[460px] bg-white/70 backdrop-blur-2xl border-2 border-white/65 p-4 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.22)] z-40 select-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/10 via-transparent to-white/10 pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="px-3 py-1.5 border-b border-black/5 mb-2 flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-black/45">
                        Farm Shield Features of App
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/15">
                        Active: {activeTab}
                      </span>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-black/10">
                      {navItems.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <Link
                            key={item.id}
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`w-full text-left flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-300 relative border group ${
                              isActive 
                                ? "bg-black text-white border-black shadow-md scale-[1.01]" 
                                : "bg-white/50 hover:bg-white/95 text-black border-black/5 hover:border-black/10 active:scale-95"
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} p-2.5 flex items-center justify-center text-white shadow-sm flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                              <IconComponent size={20} className="text-white" />
                              <div className="absolute -inset-1 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="flex-grow min-w-0 pr-4">
                              <h3 className={`font-semibold tracking-[-0.3px] text-sm ${isActive ? "text-white" : "text-black"}`}>
                                {item.id === "Diagnosis" ? "AI plant Diagnosis" : item.id === "Home" ? "Shield Home" : item.label}
                              </h3>
                              <p className={`text-xs truncate font-medium mt-0.5 ${isActive ? "text-white/70" : "text-black/50"}`}>
                                {item.desc}
                              </p>
                            </div>

                            {isActive && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white scale-110 shadow-sm border border-black/10">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </nav>

          {/* ==========================================
              Hero Title Section
             ========================================== */}
          <div className="flex flex-col items-center mt-12 md:mt-24 mb-16 -mt-[50px]">
            
            {/* Headline - Fustat typography with perfect tracking */}
            <h1 className="font-fustat font-bold text-[54px] sm:text-[68px] md:text-[80px] tracking-[-3px] sm:tracking-[-4px] md:tracking-[-4.8px] leading-[1] text-black text-center mb-8 max-w-4xl select-none">
              AI In Agriculture
            </h1>

            {/* Subtitle - Fustat Medium */}
            <p className="font-fustat font-medium text-[16px] sm:text-[18px] md:text-[20px] tracking-[-0.4px] text-[#505050] text-center leading-relaxed mb-6 max-w-[736px] w-full px-4 select-none">
              Farm Shield is an AI-powered smart agriculture platform that helps farmers detect crop diseases, predict market prices,
              It combines real-time data, AI intelligence to support faster, smarter, and more sustainable farming decisions.
            </p>

            {/* Infinite Horizontal Scroller of Icons in full width */}
            <div className="w-full overflow-hidden py-14 mt-12 z-20 relative scroller-mask">
              <div className="animate-scroller-track flex items-center gap-14">
                {[
                  ...navItems.filter(item => item.id !== "Home"),
                  ...navItems.filter(item => item.id !== "Home"),
                  ...navItems.filter(item => item.id !== "Home")
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={idx}
                      to={item.to}
                      className="flex items-center gap-3.5 text-black hover:text-emerald-800 transition-all duration-300 cursor-pointer whitespace-nowrap group"
                    >
                      <div className="w-11 h-11 bg-white/45 border border-white/60 shadow-sm backdrop-blur-[6px] rounded-xl flex items-center justify-center p-2.5 transition-transform duration-300 group-hover:scale-110">
                        <Icon size={20} className="text-black/85 group-hover:text-emerald-700" />
                      </div>
                      <span className="font-fustat font-semibold tracking-[-0.4px] text-base md:text-lg select-none">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Premium Liquid Glass Action Buttons below the Scroller */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 z-30 relative w-full px-4">
              {!isLoaded ? (
                <div className="h-14 w-44 bg-white/10 animate-pulse rounded-full" />
              ) : user ? (
                <>
                  <Link to="/diagnosis" className="liquid-glass-btn group">
                    <Sparkles size={20} className="text-white group-hover:rotate-[15deg] transition-transform duration-300" />
                    <span>Launch AI Diagnosis</span>
                  </Link>
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("open-voice-assistant"));
                    }}
                    className="liquid-glass-btn group cursor-pointer"
                  >
                    <Mic size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
                    <span>AI Chat bot</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth?tab=signup" className="liquid-glass-btn group">
                    <UserPlus size={20} className="text-white group-hover:rotate-[15deg] transition-transform duration-300" />
                    <span>Sign Up</span>
                  </Link>
                  <Link to="/auth?tab=signin" className="liquid-glass-btn group">
                    <LogIn size={20} className="text-white group-hover:translate-x-1 transition-transform duration-300" />
                    <span>Log In</span>
                  </Link>
                </>
              )}
            </div>

            {/* Core Feature Cards Row - Fixed on one dynamic horizontal line */}
            <div className="w-full mt-16 max-w-[1480px] overflow-x-auto flex flex-row flex-nowrap gap-6 items-center justify-start lg:justify-center pb-12 px-6 scrollbar-none scroller-mask-horizontal z-30 relative select-none">
              
              {/* Card 1: AI DIAGNOSIS */}
              <Link 
                to="/diagnosis"
                className="ux-parent ux-parent--mint flex-shrink-0 w-[290px] xl:w-[320px] h-[330px] block cursor-pointer transition-transform duration-300"
              >
                <div className="ux-card">
                  <div className="ux-logo" aria-hidden="true">
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle bg-[#38761d]/20 flex items-center justify-center">
                      <HeartPulse size={18} className="text-white" />
                    </span>
                  </div>
                  <div className="ux-content">
                    <span className="ux-title font-schibsted font-extrabold text-[#16300c]">AI DIAGNOSIS</span>
                    <span className="ux-text font-schibsted font-medium mt-3 text-xs leading-relaxed text-[#224414]">
                      Upload a plant image and get instant disease identification with treatment recommendations.
                    </span>
                  </div>
                  <div className="ux-bottom">
                    <div className="ux-social">
                      <button type="button" className="ux-social-btn" aria-label="AI Activity">
                        <Sparkles size={13} className="text-[#38761d]" />
                      </button>
                    </div>
                    <div className="ux-more">
                      <span className="ux-more-btn font-schibsted text-[10px] tracking-wider font-extrabold text-[#38761d]">IDENTIFY</span>
                      <ChevronDown size={12} className="text-[#38761d] -rotate-90 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card 2: FARMER LINKEDLIN */}
              <Link 
                to="/krishi-setu"
                className="ux-parent ux-parent--violet ux-parent--cut flex-shrink-0 w-[290px] xl:w-[320px] h-[330px] block cursor-pointer transition-transform duration-300"
              >
                <div className="ux-card">
                  <div className="ux-logo" aria-hidden="true">
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle bg-[#739c38]/25 flex items-center justify-center">
                      <Network size={18} className="text-white" />
                    </span>
                  </div>
                  <div className="ux-content">
                    <span className="ux-title font-schibsted font-extrabold text-[#1c3308]">FARMER LINKEDIN</span>
                    <span className="ux-text font-schibsted font-medium mt-3 text-xs leading-relaxed text-[#1c3308]/90">
                      It offers a localized, multi-lingual marketplace where farmers can find workers and laborers can find reliable employment.
                    </span>
                  </div>
                  <div className="ux-bottom">
                    <div className="ux-social">
                      <button type="button" className="ux-social-btn" aria-label="Farmer Network">
                        <Network size={13} className="text-[#739c38]" />
                      </button>
                    </div>
                    <div className="ux-more">
                      <span className="ux-more-btn font-schibsted text-[10px] tracking-wider font-extrabold text-[#739c38]">CONNECT</span>
                      <ChevronDown size={12} className="text-[#739c38] -rotate-90 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card 3: PRICE FORECASTING */}
              <Link 
                to="/price-forecast"
                className="ux-parent ux-parent--solar flex-shrink-0 w-[290px] xl:w-[320px] h-[330px] block cursor-pointer transition-transform duration-300"
              >
                <div className="ux-card">
                  <div className="ux-logo" aria-hidden="true">
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle bg-[#1f6f5b]/25 flex items-center justify-center">
                      <TrendingUp size={18} className="text-white" />
                    </span>
                  </div>
                  <div className="ux-content">
                    <span className="ux-title font-schibsted font-extrabold text-[#092f25]">PRICE FORECASTING</span>
                    <span className="ux-text font-schibsted font-medium mt-3 text-xs leading-relaxed text-[#115243]">
                      Farm Shield helps you anticipate price fluctuations for various crop, maximizing your profitability 
                    </span>
                  </div>
                  <div className="ux-bottom">
                    <div className="ux-social">
                      <button type="button" className="ux-social-btn" aria-label="Trends Analysis">
                        <TrendingUp size={13} className="text-[#1f6f5b]" />
                      </button>
                    </div>
                    <div className="ux-more">
                      <span className="ux-more-btn font-schibsted text-[10px] tracking-wider font-extrabold text-[#1f6f5b]">PREDICT</span>
                      <ChevronDown size={12} className="text-[#1f6f5b] -rotate-90 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card 4: AI CHAT-BOT */}
              <div 
                onClick={() => window.dispatchEvent(new CustomEvent("open-voice-assistant"))}
                className="ux-parent ux-parent--void flex-shrink-0 w-[290px] xl:w-[320px] h-[330px] block cursor-pointer transition-transform duration-300"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    window.dispatchEvent(new CustomEvent("open-voice-assistant"));
                  }
                }}
              >
                <div className="ux-card">
                  <div className="ux-logo" aria-hidden="true">
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle"></span>
                    <span className="ux-circle bg-[#5eead4]/25 flex items-center justify-center">
                      <Mic size={18} className="text-white" />
                    </span>
                  </div>
                  <div className="ux-content">
                    <span className="ux-title font-schibsted font-extrabold text-[#e2fbf3]">AI CHAT-BOT</span>
                    <span className="ux-text font-schibsted font-medium mt-3 text-xs leading-relaxed text-[#e2fbf3]/85">
                      Not comfortable typing? Just tap the microphone icon. Farm Shield's AI Voice Assistant understands and speaks multiple Indian languages 
                    </span>
                  </div>
                  <div className="ux-bottom">
                    <div className="ux-social">
                      <button type="button" className="ux-social-btn" aria-label="Voice Interface">
                        <Mic size={13} className="text-[#0b3d2e]" />
                      </button>
                    </div>
                    <div className="ux-more">
                      <span className="ux-more-btn font-schibsted text-[10px] tracking-wider font-extrabold text-[#5eead4]">TALK Now</span>
                      <ChevronDown size={12} className="text-[#5eead4] -rotate-90 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* SVG Liquid Distortion Filters backing custom reflections */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <filter id="glass" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">  
              <feDisplacementMap in="SourceGraphic" scale="40" xChannelSelector="A" yChannelSelector="R" result="goo" />
              <feGaussianBlur in="goo" stdDeviation="6" />
            </filter>
          </defs>
        </svg>

        {/* ==========================================
            Comprehensive SEO Grid Section (Glassmorphic)
           ========================================== */}
        <section className="w-full py-24 sm:py-32 bg-[#050806]/80 relative overflow-hidden border-t border-white/5 z-20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-[-10%] w-[50%] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
          </div>

          <div className="max-w-[1580px] mx-auto px-6 md:px-10 xl:px-14 relative z-10">
            <div className="text-center mb-20 max-w-4xl mx-auto">
              <h2 className="font-fustat font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
                Empowering Indian Agriculture with <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  AI Innovation & Smart Solutions
                </span>
              </h2>
              <p className="mt-6 font-fustat font-medium text-base sm:text-lg text-gray-400 leading-relaxed">
                Farm Shield is a comprehensive digital agricultural ecosystem designed to protect crops, optimize yields, and connect farming communities across India. From instant plant disease diagnosis using advanced AI, to real-time market price forecasting, Krishi Setu labor marketplace, and automated government scheme discovery, our platform is built for the modern farmer. We leverage cutting-edge technology to bring accessible, multi-lingual agricultural intelligence right to your smartphone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
              {[
                {
                  icon: Camera,
                  title: "AI Crop Diagnosis",
                  description: "Our core feature utilizes cutting-edge machine learning to identify plant diseases from a simple smartphone photo. Farm Shield instantly provides confidence scores, severity assessments, and actionable treatment plans, ensuring you can tackle crop health issues before they spread. Supports a massive database of regional Indian crops.",
                  color: "text-emerald-400 animate-pulse",
                  to: "/diagnosis"
                },
                {
                  icon: Network,
                  title: "Krishi Setu Labor Marketplace",
                  description: "Bridge the gap between farmers and skilled agricultural labor. Krishi Setu offers a localized, multi-lingual marketplace where farmers can find workers and laborers can find reliable employment. Features dynamic location matching and instant auto-translation (Hindi, Kannada, English) for seamless communication.",
                  color: "text-purple-400 animate-pulse",
                  to: "/krishi-setu"
                },
                {
                  icon: TrendingUp,
                  title: "Market Price Forecasting",
                  description: "Make informed selling decisions with our predictive pricing models. By analyzing historical data and market trends, Farm Shield helps you anticipate price fluctuations for various crops across different markets, maximizing your profitability and ensuring you get the best Mandi rates.",
                  color: "text-amber-400 animate-pulse",
                  to: "/price-forecast"
                },
                {
                  icon: Droplet,
                  title: "Soil Intelligence",
                  description: "Comprehensive soil health analysis to determine the right crops for your specific land. Get fertilizer recommendations, understand NPK values, and optimize your soil's pH levels for maximum yield potential, tailored specifically to regional Indian topographies.",
                  color: "text-blue-400 animate-pulse",
                  to: "/soil-intelligence"
                },
                {
                  icon: Landmark,
                  title: "Kisan Times & Government Schemes",
                  description: "Stay updated with the latest agricultural news via Kisan Times. Furthermore, easily discover and apply for government subsidies, crop insurance (PMFBY), and financial assistance programs perfectly matched to your farmer profile.",
                  color: "text-teal-400 animate-pulse",
                  to: "/schemes"
                },
                {
                  icon: Mic,
                  title: "Multi-lingual Voice Assistant",
                  description: "Not comfortable typing? Just tap the microphone icon. Farm Shield's AI Voice Assistant understands and speaks multiple Indian languages (Hindi, Kannada, Telugu, Tamil, Marathi, etc.), answering your farming queries naturally and accurately.",
                  color: "text-rose-400 animate-pulse",
                  to: "/diagnosis"
                }
              ].map((seo, idx) => {
                const Icon = seo.icon;
                return (
                  <Link
                    key={idx}
                    to={seo.to}
                    className="bg-white/[0.02] border border-white/10 backdrop-blur-2xl p-8 rounded-[28px] shadow-[0_24px_50px_rgba(0,0,0,0.35)] hover:border-white/20 transition-all duration-500 hover:shadow-[0_24px_60px_rgba(74,222,128,0.12)] group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Icon className={`w-7 h-7 ${seo.color}`} />
                      </div>
                      <h3 className="font-fustat font-bold text-xl text-white mb-3 group-hover:text-emerald-400 transition-colors">
                        {seo.title}
                      </h3>
                      <p className="font-fustat font-medium text-sm text-gray-400 leading-relaxed">
                        {seo.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mt-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      Explore Service <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ==========================================
                Premium Interactive FAQs Section
               ========================================== */}
            <div className="bg-white/[0.01] border border-white/10 backdrop-blur-3xl rounded-[32px] p-8 md:p-14 shadow-[0_30px_70px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-center gap-3 mb-4">
                <HelpCircle className="text-emerald-400 w-6 h-6 animate-bounce" />
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-[11px]">Help & Support Center</span>
              </div>
              <h2 className="font-fustat font-extrabold text-2xl sm:text-3xl md:text-4xl text-center text-white mb-12">
                Frequently Asked Questions
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <FAQItem 
                  question="Is the Farm Shield AI Disease Diagnosis accurate for Indian crops?"
                  answer="Yes! Our AI model has been extensively trained on thousands of agricultural images, with a strong focus on crops grown in India (like Paddy, Sugarcane, Cotton, Ragi, Arecanut). It provides a high-accuracy confidence score and verified, actionable treatment recommendations for local pests and blights."
                />
                <FAQItem 
                  question="How does the Krishi Setu Labor Marketplace work?"
                  answer="Krishi Setu acts as a digital bridge. Farmers can post requirements for planting, harvesting, or maintenance, and local laborers can browse and accept these jobs. The system uses geolocation to connect you with nearby opportunities and auto-translates job details to your preferred language."
                />
                <FAQItem 
                  question="Can I use Farm Shield entirely in my regional language?"
                  answer="Absolutely. Farm Shield features a robust multi-lingual Voice Assistant and translation services. Whether you speak Hindi, Kannada, Telugu, Tamil, Marathi, or English, our AI chatbot will converse with you in your native tongue, and features like Krishi Setu dynamically translate content on the fly."
                />
                <FAQItem 
                  question="How reliable is the Market Price Forecasting tool?"
                  answer="Our forecasting tool aggregates historical Mandi data, real-time market trends, and predictive AI algorithms to give you highly accurate future price estimates. This helps you decide the optimal time to sell your harvest for maximum profit."
                />
                <FAQItem 
                  question="Are government schemes updated regularly?"
                  answer="Yes, our Government Schemes module is continually updated with the latest state and central agricultural subsidies, insurance policies (like PMFBY), loan waivers, and financial assistance programs to ensure you never miss out on available financial support."
                />
                <FAQItem 
                  question="How does the Soil Intelligence feature help my yield?"
                  answer="By providing detailed soil health parameters (Nitrogen, Phosphorus, Potassium levels), moisture retention, and pH balance, Soil Intelligence recommends the absolute best crops for your specific plot of land, alongside custom fertilization plans to optimize yield and reduce waste."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Modern minimal micro-footer */}
        <footer className="w-full py-8 bg-[#030504] border-t border-white/5 text-center text-xs text-gray-500 font-inter z-20 mt-auto">
          <div className="max-w-[1580px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} Farm Shield. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Farmer Support</a>
            </div>
          </div>
        </footer>
      </main>
      <VoiceNavigation />
    </>
  );
}
