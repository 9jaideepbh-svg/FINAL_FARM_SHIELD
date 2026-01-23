import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, FlaskConical, Leaf, AlertCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SoilAnalysisResult } from "@/components/soil/SoilAnalysisResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const soilFormSchema = z.object({
  nitrogen: z.coerce.number().min(0).max(500, "Nitrogen should be between 0-500 kg/ha"),
  phosphorus: z.coerce.number().min(0).max(200, "Phosphorus should be between 0-200 kg/ha"),
  potassium: z.coerce.number().min(0).max(500, "Potassium should be between 0-500 kg/ha"),
  ph: z.coerce.number().min(3).max(11, "pH should be between 3-11"),
  organic_matter: z.coerce.number().min(0).max(15).optional(),
  soil_type: z.string().optional(),
  crop_type: z.string().min(1, "Please select a crop type"),
  location: z.string().optional(),
});

type SoilFormValues = z.infer<typeof soilFormSchema>;

const CROP_TYPES = [
  "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Groundnut",
  "Tomato", "Potato", "Onion", "Chili", "Brinjal", "Cabbage", "Cauliflower",
  "Mango", "Banana", "Grapes", "Orange", "Apple", "Papaya",
  "Tea", "Coffee", "Rubber", "Coconut", "Other"
];

const SOIL_TYPES = [
  "Clay", "Sandy", "Loamy", "Silty", "Peaty", "Chalky", "Saline", "Black Cotton", "Red Soil", "Laterite"
];

export default function Soil() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SoilFormValues>({
    resolver: zodResolver(soilFormSchema),
    defaultValues: {
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      ph: 7,
      organic_matter: undefined,
      soil_type: undefined,
      crop_type: "",
      location: "",
    },
  });

  const onSubmit = async (data: SoilFormValues) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: analysisData, error: fnError } = await supabase.functions.invoke("soil-analysis", {
        body: data,
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to analyze soil");
      }

      if (analysisData.error) {
        throw new Error(analysisData.error);
      }

      setResult(analysisData);
      toast({
        title: "Analysis Complete",
        description: `Soil health score: ${analysisData.soil_health_score}/100`,
      });
    } catch (err) {
      console.error("Soil analysis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze soil";
      setError(message);
      toast({
        title: "Analysis Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setError(null);
    form.reset();
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Soil Quality Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Enter your soil test data to get AI-powered NPK recommendations and improvement suggestions
          </p>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Soil Test Data
              </CardTitle>
              <CardDescription>
                Enter the values from your soil testing report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* NPK Values */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nitrogen"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nitrogen (N) kg/ha</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g., 250" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phosphorus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phosphorus (P) kg/ha</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g., 25" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="potassium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potassium (K) kg/ha</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g., 200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* pH and Organic Matter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ph"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soil pH</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g., 6.5" {...field} />
                          </FormControl>
                          <FormDescription>Neutral pH is around 7.0</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organic_matter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organic Matter % (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} />
                          </FormControl>
                          <FormDescription>Typical range: 1-5%</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Soil Type and Crop Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="soil_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soil Type (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select soil type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SOIL_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="crop_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crop Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select crop type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CROP_TYPES.map((crop) => (
                                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Nashik, Maharashtra" {...field} />
                        </FormControl>
                        <FormDescription>Helps provide region-specific recommendations</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center">
                    <Button type="submit" size="lg" disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Soil...
                        </>
                      ) : (
                        "Analyze Soil"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <SoilAnalysisResult result={result} />
            <div className="flex justify-center">
              <Button onClick={handleNewAnalysis} size="lg">
                New Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
