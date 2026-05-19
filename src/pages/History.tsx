import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  Calendar,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Trash2,
  Microscope,
  FlaskConical,
  Activity,
  History as HistoryIcon,
  Download,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDiagnosisHistory,
  deleteDiagnosisRecord,
  fetchDiagnosisById,
  type DiagnosisHistoryRecord,
} from "@/lib/diagnosisHistory";
import { cn } from "@/lib/utils";
import { DiagnosisResultCards } from "@/components/diagnosis/DiagnosisResultCards";
import { generateDiagnosisPDF } from "@/lib/generateDiagnosisPDF";

// ─── Severity color helper ────────────────────────────────────────────────────
function severityBadge(severity: string) {
  switch (severity) {
    case "none":
    case "low":
      return "bg-green-500/15 text-green-700 border-green-500/25";
    case "medium":
      return "bg-amber-500/15 text-amber-700 border-amber-500/25";
    case "high":
      return "bg-orange-500/15 text-orange-700 border-orange-500/25";
    case "critical":
      return "bg-red-500/15 text-red-700 border-red-500/25";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function History() {
  const { user, isLoaded: authLoaded } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [records, setRecords] = useState<DiagnosisHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<DiagnosisHistoryRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── PDF generation state ──────────────────────────────────────────────────
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoaded && !user) navigate("/auth");
  }, [user, authLoaded, navigate]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchDiagnosisHistory(user.id);
      setRecords(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      toast({
        title: "Error",
        description: "Could not load diagnosis history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDiagnosisRecord(deleteId);
      setRecords((prev) => prev.filter((r) => r.id !== deleteId));
      toast({
        title: "Deleted",
        description: "Diagnosis removed from history.",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Error",
        description: "Could not delete the diagnosis record.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleCardClick = async (record: DiagnosisHistoryRecord) => {
    setSelectedRecord(record);
    setLoadingDetail(true);
    try {
      const fullRecord = await fetchDiagnosisById(record.id);
      if (fullRecord) setSelectedRecord(fullRecord);
    } catch (err) {
      console.error("Failed to fetch full diagnosis detail:", err);
      toast({
        title: "Warning",
        description: "Could not fetch the latest full diagnosis details.",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── PDF Download handler ───────────────────────────────────────────────────
  const handleDownloadPDF = async (e: React.MouseEvent, record: DiagnosisHistoryRecord) => {
    e.stopPropagation();
    setPdfLoadingId(record.id);

    try {
      // Ensure we have the full groqResponse
      let fullRecord = record;
      if (!record.groqResponse) {
        const fetched = await fetchDiagnosisById(record.id);
        if (fetched) fullRecord = fetched;
      }
      
      if (!fullRecord.groqResponse) {
        throw new Error("Diagnosis data is missing the full AI response.");
      }

      await generateDiagnosisPDF(fullRecord);
      
      toast({
        title: "✅ PDF Downloaded!",
        description: `FarmShield_Diagnosis_${fullRecord.plantName}.pdf saved successfully.`,
      });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast({ 
        title: "PDF Error", 
        description: "Could not generate PDF. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setPdfLoadingId(null);
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
      <div className="container py-8 md:py-12">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
              <HistoryIcon className="h-3.5 w-3.5" />
              Firestore · plant_diagnosis_history
            </div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Diagnosis History
            </h1>
            <p className="text-muted-foreground text-sm">
              View all your past AI plant diagnoses — images persisted on Cloudinary
            </p>
          </div>
          <Button asChild className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20">
            <Link to="/diagnosis">
              <Camera className="h-4 w-4" />
              New Diagnosis
            </Link>
          </Button>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : records.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-primary/20">
            <CardContent>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Diagnoses Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
                Start by uploading a plant photo. Your diagnosis history will appear here.
              </p>
              <Button asChild>
                <Link to="/diagnosis">
                  <Microscope className="mr-2 h-4 w-4" />
                  Start First Diagnosis
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {records.map((record) => (
              <Card
                key={record.id}
                className={cn(
                  "overflow-hidden border-2 hover:shadow-lg transition-all duration-200 group cursor-pointer",
                  record.isHealthy
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : "border-red-500/15 hover:border-red-500/30"
                )}
                onClick={() => handleCardClick(record)}
              >
                {/* Image */}
                {record.imageUrl ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={record.imageUrl}
                      alt={record.plantName || "Plant"}
                      className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <Badge
                        className={cn(
                          "text-xs border capitalize",
                          severityBadge(record.severity)
                        )}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        {record.severity} severity
                      </Badge>
                      {record.isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-44 bg-muted flex items-center justify-center">
                    <Leaf className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  {/* Plant & Disease */}
                  <div>
                    <h3 className="font-bold text-base truncate">{record.plantName}</h3>
                    <p className="text-sm text-muted-foreground italic truncate">
                      {record.scientificName}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium mt-1",
                        record.isHealthy ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {record.isHealthy ? "✅ Healthy" : `⚠️ ${record.diseaseName}`}
                    </p>
                  </div>

                  {/* Groq summary */}
                  <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-lg border border-muted">
                    {record.groqSummary}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      {record.overallConfidence}% confidence
                    </Badge>
                    {record.fertilizerCount > 0 && (
                      <Badge variant="outline" className="text-xs border-green-500/30 text-green-600">
                        <FlaskConical className="h-3 w-3 mr-1" />
                        {record.fertilizerCount} fertilizers
                      </Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(record.timestamp).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Download PDF button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10 gap-1.5 text-xs font-semibold"
                        onClick={(e) => handleDownloadPDF(e, record)}
                        disabled={pdfLoadingId === record.id}
                        title="Download PDF Report"
                      >
                        {pdfLoadingId === record.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </>
                        )}
                      </Button>
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(record.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Diagnosis Record</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the diagnosis from your Firestore history.
              The Cloudinary image will remain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Diagnosis Detail Modal ─────────────────────────────────────────── */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              Detailed Diagnosis Results
              {loadingDetail && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedRecord && (
              <div className="space-y-6">
                {/* Cloudinary image card */}
                {selectedRecord.imageUrl && (
                  <Card className="overflow-hidden border-2 border-primary/20 shadow-xl rounded-2xl">
                    <img
                      src={selectedRecord.imageUrl}
                      alt={selectedRecord.plantName || "Diagnosed plant"}
                      className="w-full h-48 md:h-64 object-cover"
                    />
                  </Card>
                )}
                {selectedRecord.groqResponse ? (
                  <DiagnosisResultCards diagnosis={selectedRecord.groqResponse} />
                ) : (
                  <Card className="border border-amber-500/20 bg-amber-500/5 p-6 text-center rounded-2xl">
                    <h3 className="font-bold text-amber-800 text-lg mb-1">
                      Incomplete Data Payload
                    </h3>
                    <p className="text-sm text-amber-700/80">
                      The detailed analysis cards are unavailable for this record.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}