import { useState, useEffect } from "react";
import { 
  Loader2, 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer,
  MapPin,
  Search,
  Sunrise,
  Sunset,
  Eye,
  Gauge,
  AlertTriangle,
  Sprout,
  CheckCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    clouds: number;
    weather: { main: string; description: string; icon: string };
    sunrise: number;
    sunset: number;
    location: string;
    country: string;
  };
  forecast: Array<{
    date: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    weather: { main: string; description: string; icon: string };
    wind_speed: number;
    pop: number;
  }>;
  agricultural_insights: {
    insights: string[];
    alerts: Array<{ type: string; message: string; severity: string }>;
    farming_recommendations: {
      irrigation: string;
      spraying: string;
      harvesting: string;
    };
  };
}

const getWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case "clear":
      return <Sun className="h-12 w-12 text-yellow-500" />;
    case "clouds":
      return <Cloud className="h-12 w-12 text-gray-500" />;
    case "rain":
    case "drizzle":
      return <CloudRain className="h-12 w-12 text-blue-500" />;
    default:
      return <Cloud className="h-12 w-12 text-gray-500" />;
  }
};

const getSmallWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case "clear":
      return <Sun className="h-6 w-6 text-yellow-500" />;
    case "clouds":
      return <Cloud className="h-6 w-6 text-gray-500" />;
    case "rain":
    case "drizzle":
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    default:
      return <Cloud className="h-6 w-6 text-gray-500" />;
  }
};

export default function Weather() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [searchCity, setSearchCity] = useState("");

  useEffect(() => {
    // Try to get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to a city if location access denied
          fetchWeatherByCity("New Delhi");
        }
      );
    } else {
      fetchWeatherByCity("New Delhi");
    }
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("weather", {
        body: { lat, lon },
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setWeather(data);
      setCity(data.current.location);
    } catch (err) {
      console.error("Weather error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherByCity = async (cityName: string) => {
    if (!cityName.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("weather", {
        body: { city: cityName },
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setWeather(data);
      setCity(data.current.location);
      setSearchCity("");
    } catch (err) {
      console.error("Weather error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "City not found",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeatherByCity(searchCity);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDay = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  if (isLoading && !weather) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Weather Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time weather data and agricultural insights for your farm
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md mx-auto">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter city name..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {error && !weather && (
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {weather && (
          <div className="space-y-6">
            {/* Current Weather */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/80 to-primary p-6 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5" />
                      <span className="text-lg">{weather.current.location}, {weather.current.country}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {getWeatherIcon(weather.current.weather.main)}
                      <div>
                        <p className="text-5xl font-bold">{Math.round(weather.current.temp)}°C</p>
                        <p className="capitalize">{weather.current.weather.description}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-primary-foreground/80">
                      Feels like {Math.round(weather.current.feels_like)}°C
                    </p>
                  </div>
                  <div className="text-right space-y-2 text-sm">
                    <div className="flex items-center gap-2 justify-end">
                      <Sunrise className="h-4 w-4" />
                      <span>{formatTime(weather.current.sunrise)}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Sunset className="h-4 w-4" />
                      <span>{formatTime(weather.current.sunset)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Droplets className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="text-xl font-semibold">{weather.current.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Wind className="h-8 w-8 text-gray-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wind</p>
                      <p className="text-xl font-semibold">{weather.current.wind_speed} m/s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Gauge className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pressure</p>
                      <p className="text-xl font-semibold">{weather.current.pressure} hPa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Eye className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Visibility</p>
                      <p className="text-xl font-semibold">{(weather.current.visibility / 1000).toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agricultural Alerts */}
            {weather.agricultural_insights.alerts.length > 0 && (
              <div className="space-y-2">
                {weather.agricultural_insights.alerts.map((alert, idx) => (
                  <Alert 
                    key={idx} 
                    variant={alert.severity === "warning" ? "destructive" : "default"}
                    className={alert.severity === "info" ? "border-blue-200 bg-blue-50" : ""}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="capitalize">{alert.type.replace("_", " ")} Alert</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Farming Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  Farming Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">Irrigation</span>
                    </div>
                    <p className="text-sm">{weather.agricultural_insights.farming_recommendations.irrigation}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold">Spraying</span>
                    </div>
                    <Badge variant={weather.agricultural_insights.farming_recommendations.spraying === "Favorable" ? "default" : "secondary"}>
                      {weather.agricultural_insights.farming_recommendations.spraying}
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">Harvesting</span>
                    </div>
                    <p className="text-sm">{weather.agricultural_insights.farming_recommendations.harvesting}</p>
                  </div>
                </div>

                {/* Insights */}
                {weather.agricultural_insights.insights.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Agricultural Insights</h4>
                    <ul className="space-y-1">
                      {weather.agricultural_insights.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 7-Day Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {weather.forecast.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "text-center p-3 rounded-lg",
                        idx === 0 ? "bg-primary/10" : "bg-muted/50"
                      )}
                    >
                      <p className="font-semibold text-sm">
                        {idx === 0 ? "Today" : formatDay(day.date)}
                      </p>
                      <div className="flex justify-center my-2">
                        {getSmallWeatherIcon(day.weather.main)}
                      </div>
                      <p className="text-xs capitalize text-muted-foreground mb-2">
                        {day.weather.description}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <span className="font-semibold">{Math.round(day.temp_max)}°</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{Math.round(day.temp_min)}°</span>
                      </div>
                      {day.pop > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-blue-500 mt-1">
                          <CloudRain className="h-3 w-3" />
                          <span>{Math.round(day.pop * 100)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
