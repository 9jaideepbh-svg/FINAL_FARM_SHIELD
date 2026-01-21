import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Leaf, 
  Calendar,
  TrendingUp,
  Shield,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DiagnosisDetails {
  symptoms_observed?: string[];
  affected_parts?: string[];
  disease_stage?: string;
  pathogen_type?: string;
}

interface DiagnosisResultProps {
  cropName: string;
  diseaseName: string;
  confidencePercentage: number;
  isHealthy: boolean;
  severity?: string | null;
  diagnosisDetails?: DiagnosisDetails;
  treatmentRecommendations?: string[];
  preventionTips?: string[];
  diagnosisDate: string;
  lowConfidenceWarning?: boolean;
  imageUrl?: string;
}

export function DiagnosisResult({
  cropName,
  diseaseName,
  confidencePercentage,
  isHealthy,
  severity,
  diagnosisDetails,
  treatmentRecommendations,
  preventionTips,
  diagnosisDate,
  lowConfidenceWarning,
  imageUrl,
}: DiagnosisResultProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formattedDate = new Date(diagnosisDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      {/* Low Confidence Warning */}
      {lowConfidenceWarning && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-foreground">Low Confidence Diagnosis</p>
              <p className="text-sm text-muted-foreground">
                Diagnosis may be inaccurate. Consider consulting an agriculture expert for confirmation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Result Card */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-4 text-white",
          isHealthy ? "bg-success" : "bg-destructive"
        )}>
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
            <div>
              <h2 className="text-xl font-bold">{isHealthy ? "Healthy Plant" : diseaseName}</h2>
              <p className="text-white/80">Detected in: {cropName}</p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Confidence */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className={cn("h-6 w-6 mx-auto mb-2", getConfidenceColor(confidencePercentage))} />
              <p className="text-2xl font-bold">{confidencePercentage}%</p>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <Progress value={confidencePercentage} className="mt-2 h-2" />
            </div>

            {/* Severity */}
            {severity && !isHealthy && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <Badge className={cn("text-base px-3 py-1", getSeverityColor(severity))}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">Severity</p>
              </div>
            )}

            {/* Date */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">Diagnosis Date</p>
            </div>
          </div>

          {/* Diagnosis Details */}
          {diagnosisDetails && Object.keys(diagnosisDetails).length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Diagnosis Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnosisDetails.symptoms_observed && diagnosisDetails.symptoms_observed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Symptoms Observed</p>
                      <ul className="space-y-1">
                        {diagnosisDetails.symptoms_observed.map((symptom, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diagnosisDetails.affected_parts && diagnosisDetails.affected_parts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Affected Parts</p>
                      <div className="flex flex-wrap gap-2">
                        {diagnosisDetails.affected_parts.map((part, idx) => (
                          <Badge key={idx} variant="outline">{part}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {diagnosisDetails.disease_stage && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Disease Stage</p>
                      <Badge variant="secondary" className="capitalize">
                        {diagnosisDetails.disease_stage}
                      </Badge>
                    </div>
                  )}
                  {diagnosisDetails.pathogen_type && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Pathogen Type</p>
                      <Badge variant="secondary" className="capitalize">
                        {diagnosisDetails.pathogen_type}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Treatment Recommendations */}
      {treatmentRecommendations && treatmentRecommendations.length > 0 && !isHealthy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Treatment Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {treatmentRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Prevention Tips */}
      {preventionTips && preventionTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-accent" />
              Prevention Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {preventionTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}