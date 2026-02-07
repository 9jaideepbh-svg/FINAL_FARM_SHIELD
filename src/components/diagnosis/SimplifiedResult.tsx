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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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

      {/* Plant Name & Condition Card */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-6 text-white",
          isHealthy ? "bg-success" : "bg-destructive"
        )}>
          <div className="flex items-center gap-4">
            {isHealthy ? (
              <CheckCircle className="h-10 w-10" />
            ) : (
              <XCircle className="h-10 w-10" />
            )}
            <div>
              <p className="text-white/80 text-sm mb-1">Plant Identified</p>
              <h2 className="text-2xl font-bold">{plantName}</h2>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          {/* Condition */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Condition
            </h3>
            <p className="text-xl font-medium">{condition}</p>
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

      {/* Action Plan */}
      {actionPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-primary" />
              Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Immediate Actions */}
            {actionPlan.immediate_actions?.length > 0 && (
              <div>
                <h4 className="font-medium text-destructive mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  Immediate Actions (Do Now)
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

            {/* Short Term */}
            {actionPlan.short_term?.length > 0 && (
              <div>
                <h4 className="font-medium text-warning mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
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

            {/* Long Term */}
            {actionPlan.long_term?.length > 0 && (
              <div>
                <h4 className="font-medium text-success mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
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
          </CardContent>
        </Card>
      )}

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
              {/* Soil Management */}
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

              {/* Water Management */}
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

              {/* Nutrient Management */}
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

              {/* Pest Prevention */}
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

              {/* Nutrient Management */}
              {improvements.nutrient_management?.length > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Nutrient Management
                  </h4>
                  <ul className="space-y-1">
                    {improvements.nutrient_management.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pest Prevention */}
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
