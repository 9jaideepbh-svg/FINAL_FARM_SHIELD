import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Diagnosis from "./pages/Diagnosis";
import DiagnosisDetail from "./pages/DiagnosisDetail";
import History from "./pages/History";
import Schemes from "./pages/Schemes";
import Soil from "./pages/Soil";
import SoilIntelligence from "./pages/SoilIntelligence";
import Weather from "./pages/Weather";
import PriceForecast from "./pages/PriceForecast";
import FarmerBlog from "./pages/FarmerBlog";
import CropSimulator from "./pages/CropSimulator";
import KrishiSetu from "./pages/KrishiSetu/Index";
import NotFound from "./pages/NotFound";
import SSOCallback from "./pages/SSOCallback";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/diagnosis"
            element={
              <ErrorBoundary>
                <Diagnosis />
              </ErrorBoundary>
            }
          />
          <Route
            path="/diagnosis/:id"
            element={
              <ErrorBoundary>
                <DiagnosisDetail />
              </ErrorBoundary>
            }
          />
          <Route path="/history" element={<History />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/soil" element={<Soil />} />
          <Route path="/soil-intelligence" element={<SoilIntelligence />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/price-forecast" element={<PriceForecast />} />
          <Route path="/simulator" element={<CropSimulator />} />
          <Route path="/farmer-blog" element={<FarmerBlog />} />
          <Route path="/krishi-setu/*" element={<KrishiSetu />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;