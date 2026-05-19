import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  Calendar,
  CloudUpload,
  Activity,
  History,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchDiagnosisById, type DiagnosisHistoryRecord } from "@/lib/diagnosisHistory";
import { DiagnosisResultCards } from "@/components/diagnosis/DiagnosisResultCards";

export default function DiagnosisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [record, setRecord] = useState<DiagnosisHistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRecord(id);
    }
  }, [id]);

  const loadRecord = async (recordId: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[DiagnosisDetail] Fetching Firestore doc: ${recordId}`);
      const data = await fetchDiagnosisById(recordId);
      console.log(`[DiagnosisDetail] Fetched data:`, data);
      
      if (!data) {
        setError("Diagnosis record not found in database.");
        return;
      }

      // Safe check for the nested groqResponse structure
      if (!data.groqResponse) {
        console.warn("[DiagnosisDetail] groqResponse field is missing or malformed");
      }

      setRecord(data);
    } catch (err) {
      console.error("[DiagnosisDetail] Error loading document:", err);
      setError(err instanceof Error ? err.message : "Failed to load diagnosis record.");
      toast({
        title: "Error Loading Record",
        description: "There was a problem retrieving the diagnosis from Firestore.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-5xl">
        {/* Navigation Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/history")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to History
          </Button>

          {record && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/65 px-3 py-1.5 rounded-full border border-muted">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(record.timestamp).toLocaleDateString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="border-dashed border-2 border-destructive/20 text-center py-16">
            <CardContent className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto text-destructive">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Diagnosis Data Unavailable</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {error}
              </p>
              <Button asChild variant="outline">
                <Link to="/history" className="gap-2">
                  <History className="h-4 w-4" />
                  Return to History
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Render */}
        {!loading && !error && record && (
          <div className="space-y-6">
            {/* Cloudinary image card */}
            {record.imageUrl && (
              <Card className="overflow-hidden border-2 border-primary/20 shadow-xl rounded-2xl">
                <img
                  src={record.imageUrl}
                  alt={record.plantName || "Diagnosed plant"}
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="px-5 py-3 bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudUpload className="h-3.5 w-3.5 text-primary" />
                    Stored securely on Cloudinary
                  </div>
                  <div className="font-mono text-muted-foreground/60">
                    ID: {record.id}
                  </div>
                </div>
              </Card>
            )}

            {/* Premium 6-Card Result Viewer */}
            {record.groqResponse ? (
              <DiagnosisResultCards diagnosis={record.groqResponse} />
            ) : (
              <Card className="border border-amber-500/20 bg-amber-500/5 p-6 text-center rounded-2xl">
                <h3 className="font-bold text-amber-800 text-lg mb-1">
                  Incomplete Data Payload
                </h3>
                <p className="text-sm text-amber-700/80">
                  The original API response structure was malformed or missing. Showing basic information:
                </p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div className="bg-white p-3 rounded-lg border border-muted">
                    <span className="text-xs text-muted-foreground">Plant:</span>
                    <p className="font-bold text-sm truncate">{record.plantName}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-muted">
                    <span className="text-xs text-muted-foreground">Disease:</span>
                    <p className="font-bold text-sm truncate">{record.diseaseName}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-muted">
                    <span className="text-xs text-muted-foreground">Severity:</span>
                    <p className="font-bold text-sm capitalize">{record.severity}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-muted">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <p className="font-bold text-sm">{record.overallConfidence}%</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
