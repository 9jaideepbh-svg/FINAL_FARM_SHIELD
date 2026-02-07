import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ImageUpload } from "@/components/diagnosis/ImageUpload";
import { SimplifiedResult } from "@/components/diagnosis/SimplifiedResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { uploadPlantImage } from "@/lib/supabase-storage";
import { supabase } from "@/integrations/supabase/client";

interface ActionPlan {
  immediate_actions: string[];
  short_term: string[];
  long_term: string[];
}

interface Improvements {
  soil_management: string[];
  water_management: string[];
  nutrient_management: string[];
  pest_prevention: string[];
}

interface DiagnosisResultData {
  diagnosis_id?: string;
  crop_name: string;
  disease_name: string;
  confidence_percentage: number;
  is_healthy: boolean;
  severity?: string | null;
  diagnosis_details?: {
    symptoms_observed?: string[];
    affected_parts?: string[];
    disease_stage?: string;
    pathogen_type?: string;
    action_plan?: ActionPlan;
    improvements?: Improvements;
  };
  action_plan?: ActionPlan;
  improvements?: Improvements;
  prevention_tips?: string[];
  diagnosis_date: string;
  low_confidence_warning?: boolean;
}

export default function Diagnosis() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Upload image to storage
      const { url: imageUrl } = await uploadPlantImage(selectedFile, user.id);

      // Convert image to base64 for AI analysis
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const imageBase64 = await base64Promise;

      // Call the diagnosis edge function
      const { data, error: fnError } = await supabase.functions.invoke("diagnose-plant", {
        body: {
          imageBase64,
          imageUrl,
          userId: user.id,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to analyze image");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      
      toast({
        title: "Analysis Complete",
        description: `Detected: ${data.disease_name} in ${data.crop_name}`,
      });
    } catch (err) {
      console.error("Diagnosis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze image";
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

  const handleNewDiagnosis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  if (authLoading) {
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
      <div className="container py-8 md:py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Plant Disease Diagnosis</h1>
          <p className="text-muted-foreground">
            Upload a clear photo of your plant to get an AI-powered disease diagnosis
          </p>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Upload Plant Image</CardTitle>
              <CardDescription>
                Take or upload a clear photo of the affected plant part (leaf, stem, fruit)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                onImageSelect={handleImageSelect}
                isUploading={isAnalyzing}
                previewUrl={previewUrl}
                onClear={handleClear}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {selectedFile && !isAnalyzing && (
                <div className="flex justify-center">
                  <Button size="lg" onClick={handleAnalyze}>
                    Analyze Plant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {previewUrl && (
              <Card className="overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Analyzed plant"
                  className="w-full h-48 object-cover"
                />
              </Card>
            )}
            
            <SimplifiedResult
              plantName={result.crop_name}
              condition={result.disease_name}
              isHealthy={result.is_healthy}
              confidencePercentage={result.confidence_percentage}
              symptomsObserved={result.diagnosis_details?.symptoms_observed}
              actionPlan={result.action_plan || result.diagnosis_details?.action_plan}
              improvements={result.improvements || result.diagnosis_details?.improvements}
              severity={result.severity}
              diagnosisDate={result.diagnosis_date}
              lowConfidenceWarning={result.low_confidence_warning}
            />

            <div className="flex justify-center">
              <Button onClick={handleNewDiagnosis} size="lg">
                New Diagnosis
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}