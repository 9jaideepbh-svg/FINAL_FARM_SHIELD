import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LazyMotion, domAnimation } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";

// Keep static imports for critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// Lazy load non-critical pages
const Diagnosis = lazy(() => import("./pages/Diagnosis"));
const DiagnosisDetail = lazy(() => import("./pages/DiagnosisDetail"));
const History = lazy(() => import("./pages/History"));
const Schemes = lazy(() => import("./pages/Schemes"));
const SoilIntelligence = lazy(() => import("./pages/SoilIntelligence"));
const Weather = lazy(() => import("./pages/Weather"));
const PriceForecast = lazy(() => import("./pages/PriceForecast"));
const FarmerBlog = lazy(() => import("./pages/FarmerBlog"));
const CropSimulator = lazy(() => import("./pages/CropSimulator"));
const KrishiSetu = lazy(() => import("./pages/KrishiSetu/Index"));
const Profile = lazy(() => import("./pages/Profile"));

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { GlobalVideoBackground } from "@/components/common/GlobalVideoBackground";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Prevent browser from restoring previous scroll position
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Instantly scroll to top on path change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // To handle lazy-loaded components that might affect scroll height after render
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}

const App = () => (
  <LazyMotion features={domAnimation}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <GlobalVideoBackground />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/diagnosis"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <Diagnosis />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diagnosis/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DiagnosisDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
              <Route path="/soil" element={<ProtectedRoute><SoilIntelligence /></ProtectedRoute>} />
              <Route path="/soil-intelligence" element={<ProtectedRoute><SoilIntelligence /></ProtectedRoute>} />
              <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
              <Route path="/price-forecast" element={<ProtectedRoute><PriceForecast /></ProtectedRoute>} />
              <Route path="/simulator" element={<ProtectedRoute><CropSimulator /></ProtectedRoute>} />
              <Route path="/farmer-blog" element={<ProtectedRoute><FarmerBlog /></ProtectedRoute>} />
              <Route path="/krishi-setu/*" element={<ProtectedRoute><KrishiSetu /></ProtectedRoute>} />
              <Route path="/profile/*" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  </LazyMotion>
);

export default App;