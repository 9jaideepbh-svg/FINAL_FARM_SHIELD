import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Microscope, CloudUpload, Leaf, CheckCircle2, Sparkles, Download } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ImageUpload } from "@/components/diagnosis/ImageUpload";
import { DiagnosisResultCards } from "@/components/diagnosis/DiagnosisResultCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary, fileToBase64 } from "@/lib/cloudinary";
import { saveDiagnosisToFirestore, type DiagnosisHistoryRecord } from "@/lib/diagnosisHistory";
import { supabase } from "@/integrations/supabase/client";
import type { SanitizedDiagnosis } from "@/lib/groqDiagnosis";
import { generateDiagnosisPDF } from "@/lib/generateDiagnosisPDF";
import { cn } from "@/lib/utils";

// ─── Pipeline step definition ─────────────────────────────────────────────────
interface PipelineStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "upload",
    label: "Uploading Image",
    description: "Storing your plant image securely on Cloudinary...",
    icon: CloudUpload,
  },
  {
    id: "enhance",
    label: "Enhancing with AI",
    description: "Applying smart sharpening & contrast correction via Cloudinary...",
    icon: Sparkles,
  },
  {
    id: "ai",
    label: "Running AI Diagnosis",
    description: "PlantNet + Plant.id running in parallel · Groq sanitizing...",
    icon: Microscope,
  },
  {
    id: "saving",
    label: "Saving to History",
    description: "Storing your diagnosis record in Firestore...",
    icon: Leaf,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Diagnosis() {
  const { user, isLoaded: authLoaded } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [result, setResult] = useState<SanitizedDiagnosis | null>(null);
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pre-computed base64 — populated immediately when the user selects a file,
   * so it is ready before Analyze is clicked (no blocking wait during the pipeline).
   */
  const precomputedBase64Ref = useRef<Promise<string> | null>(null);

  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    if (authLoaded && !user) {
      navigate("/auth");
    }
  }, [user, authLoaded, navigate]);

  const handleDownloadPDF = async () => {
    if (!result || !user) return;
    setPdfGenerating(true);
    try {
      // Map active result & image into the DiagnosisHistoryRecord shape
      const record: Partial<DiagnosisHistoryRecord> = {
        id: "active-session",
        userId: user.id,
        imageUrl: enhancedImageUrl ?? cloudinaryImageUrl ?? previewUrl ?? "",
        plantName: result.plantName,
        groqResponse: result,
      };

      await generateDiagnosisPDF(record as DiagnosisHistoryRecord);

      toast({
        title: "✅ PDF Report Saved!",
        description: `FarmShield_Diagnosis_${result.plantName}.pdf has been generated successfully.`,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast({
        title: "PDF Error",
        description: "Could not generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const markStep = (stepId: string) => setCurrentStep(stepId);
  const completeStep = (stepId: string) =>
    setCompletedSteps((prev) => [...prev, stepId]);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setCompletedSteps([]);
    setCurrentStep(null);
    // ⚡ Start base64 conversion immediately in background — ready before user clicks Analyze
    precomputedBase64Ref.current = fileToBase64(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setCompletedSteps([]);
    setCurrentStep(null);
    setCloudinaryImageUrl(null);
    setEnhancedImageUrl(null);
    precomputedBase64Ref.current = null;
  };

  const handleNewDiagnosis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setCompletedSteps([]);
    setCurrentStep(null);
    setCloudinaryImageUrl(null);
    setEnhancedImageUrl(null);
    precomputedBase64Ref.current = null;
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;

    setIsAnalyzing(true);
    setError(null);
    setCompletedSteps([]);

    try {
      // ── Step 1 + Parallel: Upload to Cloudinary & await pre-computed base64 simultaneously ──
      // base64 was already started in handleImageSelect (instant if user took >0.5s to click)
      markStep("upload");
      const [cloudinaryResult, imageBase64] = await Promise.all([
        uploadToCloudinary(selectedFile),
        precomputedBase64Ref.current ?? fileToBase64(selectedFile), // fallback if ref missing
      ]);

      const imageUrl = cloudinaryResult.url;            // original — stored in Firestore
      const enhancedUrl = cloudinaryResult.enhancedUrl; // AI-enhanced URL (instant string transform)
      setCloudinaryImageUrl(imageUrl);
      setEnhancedImageUrl(enhancedUrl);
      setPreviewUrl(enhancedUrl);
      completeStep("upload");

      // ── Step 2: Enhance (URL already built — just mark the visual step) ────────────
      markStep("enhance");
      completeStep("enhance");

      // ── Step 3: Call Supabase Edge Function (PlantNet ∥∥ Plant.id + Groq) ───────
      // All sensitive API keys live ONLY inside the Edge Function — never in browser
      markStep("ai");
      const { data, error: fnError } = await supabase.functions.invoke("plant-diagnosis", {
        body: { imageBase64 },
      });

      console.log("[Diagnosis] Edge function returned data:", data);

      if (fnError) {
        // Try to extract the real error message from the edge function's response body
        // The Supabase SDK wraps the actual body in fnError.context or fnError.message
        const context = (fnError as unknown as { context?: { json?: () => Promise<{ error?: string }> } }).context;
        let detail = fnError.message || "Edge Function failed.";
        if (context?.json) {
          try {
            const body = await context.json();
            if (body?.error) detail = body.error;
          } catch {
            // fallback to fnError.message
          }
        }
        throw new Error(detail);
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      const sanitized = data as SanitizedDiagnosis;
      console.log("[Diagnosis] Sanitized result being set to state:", sanitized);
      completeStep("ai");

      // ── Step 4: Save to Firestore ─────────────────────────────────────────
      markStep("saving");
      await saveDiagnosisToFirestore(user.id, imageUrl, sanitized);
      completeStep("saving");

      setResult(sanitized);

      toast({
        title: "Diagnosis Complete ✅",
        description: sanitized.groqSummary,
      });
    } catch (err) {
      console.error("Diagnosis pipeline error:", err);
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast({
        title: "Diagnosis Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentStep(null);
    }
  };

  if (!authLoaded) {
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
      <div className="container py-8 md:py-12 max-w-4xl">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Microscope className="h-4 w-4" />
            AI-Powered Plant Diagnosis
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            Plant Disease Diagnosis
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload a clear photo of your plant. Our AI pipeline — PlantNet + Plant.id + Groq — runs securely server-side and delivers a premium diagnosis report.
          </p>
        </div>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        {!result ? (
          <div className="space-y-6">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudUpload className="h-5 w-5 text-primary" />
                  Upload Plant Image
                </CardTitle>
                <CardDescription>
                  Drag & drop or choose a photo — JPG, PNG, WebP up to 10 MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  isUploading={isAnalyzing}
                  previewUrl={previewUrl}
                  onClear={handleClear}
                />

                {/* Error */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Pipeline Progress */}
                {isAnalyzing && (
                  <div className="space-y-3 p-5 rounded-xl bg-muted/40 border border-primary/10">
                    <p className="text-sm font-semibold text-center text-primary mb-4">
                      Running AI Diagnosis Pipeline…
                    </p>
                    {PIPELINE_STEPS.map((step) => {
                      const isDone = completedSteps.includes(step.id);
                      const isActive = currentStep === step.id;
                      const Icon = step.icon;
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg transition-all duration-300",
                            isDone && "bg-green-500/10 border border-green-500/20",
                            isActive && "bg-primary/10 border border-primary/30 shadow-sm",
                            !isDone && !isActive && "opacity-40"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                              isDone && "bg-green-500 text-white",
                              isActive && "bg-primary text-white",
                              !isDone && !isActive && "bg-muted text-muted-foreground"
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : isActive ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                isDone && "text-green-600",
                                isActive && "text-primary"
                              )}
                            >
                              {step.label}
                            </p>
                            {isActive && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Analyse Button */}
                {selectedFile && !isAnalyzing && (
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleAnalyze}
                      className="gap-2 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20"
                    >
                      <Microscope className="h-5 w-5" />
                      Analyse Plant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Cloudinary image preview */}
            {(enhancedImageUrl || cloudinaryImageUrl) && (
              <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                <img
                  src={enhancedImageUrl ?? cloudinaryImageUrl!}
                  alt="AI-enhanced diagnosed plant"
                  className="w-full h-56 md:h-72 object-cover"
                />
                <div className="px-4 py-2 bg-muted/60 text-xs text-muted-foreground flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <CloudUpload className="h-3 w-3" />
                    Stored on Cloudinary · Persisted in your diagnosis history
                  </div>
                  <Badge variant="outline" className="text-xs border-green-500/30 text-green-600 gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Enhanced
                  </Badge>
                </div>
              </Card>
            )}

            {/* Premium 6-Card Result */}
            <DiagnosisResultCards diagnosis={result} />

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <Button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                size="lg"
                className="w-full sm:w-auto gap-2 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all duration-300"
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download PDF Report
                  </>
                )}
              </Button>

              <Button
                onClick={handleNewDiagnosis}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2 px-8 border-2 border-primary/30 hover:bg-primary/5 hover:scale-[1.02] transition-all duration-300 backdrop-blur-md"
              >
                <Leaf className="h-5 w-5" />
                New Diagnosis
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}