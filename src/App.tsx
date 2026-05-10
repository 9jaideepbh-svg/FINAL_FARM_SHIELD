import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Diagnosis from "./pages/Diagnosis";
import History from "./pages/History";
import Schemes from "./pages/Schemes";
import Soil from "./pages/Soil";
import Weather from "./pages/Weather";
import PriceForecast from "./pages/PriceForecast";
import FarmerBlog from "./pages/FarmerBlog";
import KrishiSetu from "./pages/KrishiSetu/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/diagnosis" element={<Diagnosis />} />
            <Route path="/history" element={<History />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/price-forecast" element={<PriceForecast />} />
            <Route path="/farmer-blog" element={<FarmerBlog />} />
            <Route path="/krishi-setu/*" element={<KrishiSetu />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;