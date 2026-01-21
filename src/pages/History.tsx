import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Calendar, Leaf, AlertTriangle, CheckCircle, Camera, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Diagnosis {
  id: string;
  image_url: string;
  crop_name: string | null;
  disease_name: string | null;
  confidence_percentage: number | null;
  is_healthy: boolean | null;
  severity: string | null;
  diagnosis_date: string;
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDiagnoses();
    }
  }, [user]);

  const fetchDiagnoses = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("diagnoses")
      .select("id, image_url, crop_name, disease_name, confidence_percentage, is_healthy, severity, diagnosis_date")
      .eq("user_id", user.id)
      .order("diagnosis_date", { ascending: false });

    if (error) {
      console.error("Error fetching diagnoses:", error);
      toast({
        title: "Error",
        description: "Failed to load diagnosis history",
        variant: "destructive",
      });
    } else {
      setDiagnoses(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from("diagnoses")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete diagnosis",
        variant: "destructive",
      });
    } else {
      setDiagnoses((prev) => prev.filter((d) => d.id !== deleteId));
      toast({
        title: "Deleted",
        description: "Diagnosis removed from history",
      });
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
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
      <div className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Diagnosis History</h1>
            <p className="text-muted-foreground">
              View all your past plant disease diagnoses
            </p>
          </div>
          <Button asChild>
            <Link to="/diagnosis">
              <Camera className="mr-2 h-4 w-4" />
              New Diagnosis
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : diagnoses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Leaf className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Diagnoses Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by uploading a plant image to get your first diagnosis
              </p>
              <Button asChild>
                <Link to="/diagnosis">Start Diagnosis</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagnoses.map((diagnosis) => (
              <Card key={diagnosis.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {diagnosis.image_url && diagnosis.image_url !== "base64-upload" ? (
                  <img
                    src={diagnosis.image_url}
                    alt={diagnosis.crop_name || "Plant"}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 bg-muted flex items-center justify-center">
                    <Leaf className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold truncate">
                        {diagnosis.disease_name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {diagnosis.crop_name || "Unknown crop"}
                      </p>
                    </div>
                    {diagnosis.is_healthy ? (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    ) : diagnosis.confidence_percentage && diagnosis.confidence_percentage < 60 ? (
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {diagnosis.confidence_percentage && (
                      <Badge variant="outline">
                        {diagnosis.confidence_percentage}% confidence
                      </Badge>
                    )}
                    {diagnosis.severity && !diagnosis.is_healthy && (
                      <Badge className={cn("capitalize", getSeverityColor(diagnosis.severity))}>
                        {diagnosis.severity}
                      </Badge>
                    )}
                    {diagnosis.is_healthy && (
                      <Badge className="bg-success text-success-foreground">Healthy</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(diagnosis.diagnosis_date).toLocaleDateString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(diagnosis.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Diagnosis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this diagnosis? This action cannot be undone.
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
    </Layout>
  );
}