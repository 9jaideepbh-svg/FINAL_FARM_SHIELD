import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Leaf, 
  Calendar,
  TrendingUp,
  Shield,
  Lightbulb,
  Package,
  Beaker,
  Clock,
  Target,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DiagnosisDetails {
  symptoms_observed?: string[];
  affected_parts?: string[];
  disease_stage?: string;
  pathogen_type?: string;
}

interface TreatmentRecommendation {
  step: string;
  estimated_yield_impact: string;
  recovery_prediction: string;
}

interface RecommendedProduct {
  name: string;
  type: "organic" | "inorganic";
  category: string;
  dosage: string;
  application_method: string;
  frequency: string;
  benefits: string[];
  precautions: string[];
}

interface YieldImpactSummary {
  without_treatment: string;
  with_treatment: string;
  treatment_window: string;
}

interface RecoveryPrediction {
  timeline: string;
  success_rate: string;
  factors: string[];
}

interface DiagnosisResultProps {
  cropName: string;
  diseaseName: string;
  confidencePercentage: number;
  isHealthy: boolean;
  severity?: string | null;
  diagnosisDetails?: DiagnosisDetails;
  treatmentRecommendations?: TreatmentRecommendation[] | string[];
  preventionTips?: string[];
  diagnosisDate: string;
  lowConfidenceWarning?: boolean;
  imageUrl?: string;
  recommendedProducts?: RecommendedProduct[];
  yieldImpactSummary?: YieldImpactSummary;
  recoveryPrediction?: RecoveryPrediction;
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
  recommendedProducts,
  yieldImpactSummary,
  recoveryPrediction,
}: DiagnosisResultProps) {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-success/20 text-success border-success/30";
      case "medium":
        return "bg-warning/20 text-warning border-warning/30";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-warning";
    return "text-destructive";
  };

  const formattedDate = new Date(diagnosisDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Check if treatment recommendations are in the new format (with yield impact)
  const isEnhancedTreatment = treatmentRecommendations && 
    treatmentRecommendations.length > 0 && 
    typeof treatmentRecommendations[0] === 'object' &&
    'step' in treatmentRecommendations[0];

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

      {/* Yield Impact & Recovery Summary */}
      {!isHealthy && (yieldImpactSummary || recoveryPrediction) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Yield Impact */}
          {yieldImpactSummary && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-orange-600" />
                  Yield Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Without Treatment</p>
                  <p className="text-sm text-destructive font-medium">{yieldImpactSummary.without_treatment}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">With Treatment</p>
                  <p className="text-sm text-success font-medium">{yieldImpactSummary.with_treatment}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Treatment Window</p>
                  <p className="text-sm font-medium">{yieldImpactSummary.treatment_window}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recovery Prediction */}
          {recoveryPrediction && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-success" />
                  Recovery Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Timeline</p>
                  <p className="text-sm font-medium">{recoveryPrediction.timeline}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-sm font-medium text-success">{recoveryPrediction.success_rate}</p>
                </div>
                {recoveryPrediction.factors && recoveryPrediction.factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Key Factors</p>
                    <ul className="text-sm">
                      {recoveryPrediction.factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-success">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recommended Products */}
      {recommendedProducts && recommendedProducts.length > 0 && !isHealthy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Recommended Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedProducts.map((product, idx) => (
              <Collapsible
                key={idx}
                open={expandedProduct === idx}
                onOpenChange={() => setExpandedProduct(expandedProduct === idx ? null : idx)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Beaker className={cn(
                        "h-5 w-5",
                        product.type === "organic" ? "text-success" : "text-primary"
                      )} />
                      <div className="text-left">
                        <p className="font-semibold">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.type === "organic" ? "default" : "secondary"}>
                            {product.type}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform",
                      expandedProduct === idx && "transform rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Dosage</p>
                          <p className="text-sm">{product.dosage}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Application</p>
                          <p className="text-sm">{product.application_method}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Frequency</p>
                          <p className="text-sm">{product.frequency}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Benefits</p>
                          <ul className="space-y-1">
                            {product.benefits.map((benefit, bidx) => (
                              <li key={bidx} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Precautions</p>
                          <ul className="space-y-1">
                            {product.precautions.map((precaution, pidx) => (
                              <li key={pidx} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                                {precaution}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

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
            <ol className="space-y-4">
              {treatmentRecommendations.map((rec, idx) => {
                const isEnhanced = typeof rec === 'object' && 'step' in rec;
                const step = isEnhanced ? (rec as TreatmentRecommendation).step : (rec as string);
                const yieldImpact = isEnhanced ? (rec as TreatmentRecommendation).estimated_yield_impact : null;
                const recovery = isEnhanced ? (rec as TreatmentRecommendation).recovery_prediction : null;

                return (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step}</p>
                      {(yieldImpact || recovery) && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {yieldImpact && (
                            <div className="text-xs p-2 bg-orange-50 rounded border border-orange-100">
                              <span className="font-medium text-orange-700">Yield Impact:</span>{" "}
                              <span className="text-orange-600">{yieldImpact}</span>
                            </div>
                          )}
                          {recovery && (
                            <div className="text-xs p-2 bg-success/10 rounded border border-success/20">
                              <span className="font-medium text-success">Recovery:</span>{" "}
                              <span className="text-success/80">{recovery}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
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
