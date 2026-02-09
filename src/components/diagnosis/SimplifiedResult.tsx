import { 
  CheckCircle, 
  XCircle, 
  Leaf,
  Calendar,
  TrendingUp,
  Shield,
  Lightbulb,
  Wrench,
  ArrowUpCircle,
  AlertTriangle,
  Sprout,
  DollarSign,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

interface FertilizerRecommendation {
  name: string;
  type: string;
  npk_ratio?: string;
  dosage: string;
  application_time: string;
  application_method: string;
  benefits: string[];
}

interface OrganicAmendment {
  name: string;
  dosage: string;
  benefits: string[];
  application_method: string;
}

interface SimplifiedResultProps {
  plantName: string;
  condition: string;
  isHealthy: boolean;
  confidencePercentage: number;
  symptomsObserved?: string[];
  actionPlan?: ActionPlan;
  improvements?: Improvements;
  severity?: string | null;
  diagnosisDate: string;
  lowConfidenceWarning?: boolean;
  fertilizerRecommendations?: FertilizerRecommendation[];
  organicAmendments?: OrganicAmendment[];
}

export function SimplifiedResult({
  plantName,
  condition,
  isHealthy,
  confidencePercentage,
  symptomsObserved,
  actionPlan,
  improvements,
  severity,
  diagnosisDate,
  lowConfidenceWarning,
  fertilizerRecommendations,
  organicAmendments,
}: SimplifiedResultProps) {
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
                Consider consulting an agriculture expert for confirmation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plant Name & Condition Card - Prominent Pop-up Style */}
      <Card className="overflow-hidden shadow-xl border-2 border-primary/30">
        <div className={cn(
          "p-8 text-white text-center",
          isHealthy ? "bg-success" : "bg-destructive"
        )}>
          <div className="flex flex-col items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="h-16 w-16" />
            ) : (
              <XCircle className="h-16 w-16" />
            )}
            <div>
              <p className="text-white/80 text-sm mb-1 uppercase tracking-wider">Plant Identified</p>
              <h2 className="text-3xl md:text-4xl font-bold animate-in fade-in zoom-in duration-500">{plantName}</h2>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          {/* Condition */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Condition
            </h3>
            <p className="text-2xl font-bold">{condition}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <p className="text-sm text-muted-foreground">Date</p>
            </div>
          </div>

          {/* Symptoms Observed */}
          {symptomsObserved && symptomsObserved.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Symptoms Observed
                </h3>
                <ul className="space-y-2">
                  {symptomsObserved.map((symptom, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <span className="text-primary mt-0.5">•</span>
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detailed Recommendations Tabs (like Soil Analysis) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sprout className="h-5 w-5 text-primary" />
            Detailed Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fertilizers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fertilizers">Fertilizers</TabsTrigger>
              <TabsTrigger value="organic">Organic</TabsTrigger>
              <TabsTrigger value="plan">Action Plan</TabsTrigger>
            </TabsList>

            {/* Fertilizers Tab */}
            <TabsContent value="fertilizers" className="mt-4 space-y-4">
              {fertilizerRecommendations && fertilizerRecommendations.length > 0 ? (
                fertilizerRecommendations.map((fert, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{fert.name}</h4>
                      <Badge variant={fert.type === "organic" ? "default" : "secondary"}>
                        {fert.type}
                      </Badge>
                    </div>
                    {fert.npk_ratio && (
                      <p className="text-sm text-muted-foreground mb-2">NPK: {fert.npk_ratio}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Dosage:</strong> {fert.dosage}</p>
                      <p><strong>When:</strong> {fert.application_time}</p>
                      <p className="col-span-2"><strong>Method:</strong> {fert.application_method}</p>
                    </div>
                    {fert.benefits && fert.benefits.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Benefits:</p>
                        <ul className="text-sm text-muted-foreground">
                          {fert.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No specific fertilizer recommendations available.</p>
              )}
            </TabsContent>

            {/* Organic Tab */}
            <TabsContent value="organic" className="mt-4 space-y-4">
              {organicAmendments && organicAmendments.length > 0 ? (
                organicAmendments.map((amend, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{amend.name}</h4>
                    <p className="text-sm"><strong>Dosage:</strong> {amend.dosage}</p>
                    <p className="text-sm"><strong>Method:</strong> {amend.application_method}</p>
                    {amend.benefits && amend.benefits.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Benefits:</p>
                        <ul className="text-sm text-muted-foreground">
                          {amend.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <Leaf className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No specific organic amendments available.</p>
              )}
            </TabsContent>

            {/* Action Plan Tab */}
            <TabsContent value="plan" className="mt-4 space-y-4">
              {actionPlan && (
                <>
                  {actionPlan.immediate_actions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Immediate Actions
                      </h4>
                      <ul className="space-y-2">
                        {actionPlan.immediate_actions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs font-medium flex-shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-sm">{action}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {actionPlan.short_term?.length > 0 && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-warning" />
                        Short Term (1-2 Weeks)
                      </h4>
                      <ul className="space-y-2">
                        {actionPlan.short_term.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg border border-warning/20">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-white text-xs font-medium flex-shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-sm">{action}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {actionPlan.long_term?.length > 0 && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        Long Term (Ongoing)
                      </h4>
                      <ul className="space-y-2">
                        {actionPlan.long_term.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white text-xs font-medium flex-shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-sm">{action}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Improvements */}
      {improvements && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Improvements to Be Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {improvements.soil_management?.length > 0 && (
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                  <h4 className="font-medium text-secondary mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Soil Management
                  </h4>
                  <ul className="space-y-1">
                    {improvements.soil_management.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-secondary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {improvements.water_management?.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/15">
                  <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Water Management
                  </h4>
                  <ul className="space-y-1">
                    {improvements.water_management.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {improvements.nutrient_management?.length > 0 && (
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <h4 className="font-medium text-success mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Nutrient Management
                  </h4>
                  <ul className="space-y-1">
                    {improvements.nutrient_management.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-success">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {improvements.pest_prevention?.length > 0 && (
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <h4 className="font-medium text-warning mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Pest Prevention
                  </h4>
                  <ul className="space-y-1">
                    {improvements.pest_prevention.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-warning">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
