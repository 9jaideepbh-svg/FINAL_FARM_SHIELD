import {
  Leaf,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Beaker,
  Sprout,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SoilAnalysisResultProps {
  result: {
    soil_health_score: number;
    soil_health_status: string;
    npk_analysis: {
      nitrogen: { current_level: string; status: string; ideal_range: string; recommendation: string };
      phosphorus: { current_level: string; status: string; ideal_range: string; recommendation: string };
      potassium: { current_level: string; status: string; ideal_range: string; recommendation: string };
    };
    ph_analysis: { current_ph: string; status: string; ideal_range: string; recommendation: string };
    fertilizer_recommendations: Array<{
      name: string;
      type: string;
      npk_ratio?: string;
      dosage: string;
      application_time: string;
      application_method: string;
      estimated_cost?: string;
      benefits: string[];
    }>;
    organic_amendments: Array<{
      name: string;
      dosage: string;
      benefits: string[];
      application_method: string;
    }>;
    improvement_plan: {
      immediate_actions: string[];
      short_term: string[];
      long_term: string[];
    };
    crop_specific_advice: {
      growth_stage_nutrition: Array<{
        stage: string;
        nutrient_focus: string;
        recommended_practice: string;
      }>;
      common_deficiency_symptoms: string[];
      yield_optimization_tips: string[];
    };
    warnings: string[];
    input_data: {
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      ph: number;
      crop_type: string;
    };
  };
}

export function SoilAnalysisResult({ result }: SoilAnalysisResultProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("optimal") || statusLower.includes("good")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (statusLower.includes("low") || statusLower.includes("deficient") || statusLower.includes("acidic")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (statusLower.includes("high") || statusLower.includes("excess") || statusLower.includes("alkaline")) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    if (statusLower.includes("critical") || statusLower.includes("too")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-muted text-muted-foreground";
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("optimal") || statusLower.includes("good")) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (statusLower.includes("low") || statusLower.includes("deficient")) {
      return <TrendingDown className="h-4 w-4 text-yellow-600" />;
    }
    if (statusLower.includes("high") || statusLower.includes("excess")) {
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            {result.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-3 mb-2 last:mb-0">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm">{warning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Health Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Soil Health Analysis for {result.input_data.crop_type}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={cn("text-4xl font-bold", getHealthColor(result.soil_health_score))}>
                {result.soil_health_score}/100
              </p>
              <Badge className={getStatusColor(result.soil_health_status)}>
                {result.soil_health_status}
              </Badge>
            </div>
            <Progress value={result.soil_health_score} className="w-1/2 h-3" />
          </div>
        </CardContent>
      </Card>

      {/* NPK Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            NPK Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nitrogen */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-600">Nitrogen (N)</span>
                {getStatusIcon(result.npk_analysis.nitrogen.status)}
              </div>
              <p className="text-2xl font-bold">{result.input_data.nitrogen} kg/ha</p>
              <Badge className={cn("mt-2", getStatusColor(result.npk_analysis.nitrogen.status))}>
                {result.npk_analysis.nitrogen.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Ideal: {result.npk_analysis.nitrogen.ideal_range}
              </p>
              <p className="text-sm mt-2">{result.npk_analysis.nitrogen.recommendation}</p>
            </div>

            {/* Phosphorus */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-orange-600">Phosphorus (P)</span>
                {getStatusIcon(result.npk_analysis.phosphorus.status)}
              </div>
              <p className="text-2xl font-bold">{result.input_data.phosphorus} kg/ha</p>
              <Badge className={cn("mt-2", getStatusColor(result.npk_analysis.phosphorus.status))}>
                {result.npk_analysis.phosphorus.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Ideal: {result.npk_analysis.phosphorus.ideal_range}
              </p>
              <p className="text-sm mt-2">{result.npk_analysis.phosphorus.recommendation}</p>
            </div>

            {/* Potassium */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-600">Potassium (K)</span>
                {getStatusIcon(result.npk_analysis.potassium.status)}
              </div>
              <p className="text-2xl font-bold">{result.input_data.potassium} kg/ha</p>
              <Badge className={cn("mt-2", getStatusColor(result.npk_analysis.potassium.status))}>
                {result.npk_analysis.potassium.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Ideal: {result.npk_analysis.potassium.ideal_range}
              </p>
              <p className="text-sm mt-2">{result.npk_analysis.potassium.recommendation}</p>
            </div>
          </div>

          {/* pH Analysis */}
          <Separator className="my-6" />
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Soil pH</span>
              {getStatusIcon(result.ph_analysis.status)}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold">{result.input_data.ph}</p>
              <Badge className={getStatusColor(result.ph_analysis.status)}>
                {result.ph_analysis.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ideal: {result.ph_analysis.ideal_range}
            </p>
            <p className="text-sm mt-2">{result.ph_analysis.recommendation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fertilizers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fertilizers">Fertilizers</TabsTrigger>
              <TabsTrigger value="organic">Organic</TabsTrigger>
              <TabsTrigger value="plan">Action Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="fertilizers" className="mt-4 space-y-4">
              {result.fertilizer_recommendations?.map((fert, idx) => (
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
                    <p><strong>Method:</strong> {fert.application_method}</p>
                    {fert.estimated_cost && (
                      <p className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {fert.estimated_cost}
                      </p>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Benefits:</p>
                    <ul className="text-sm text-muted-foreground">
                      {fert.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="organic" className="mt-4 space-y-4">
              {result.organic_amendments?.map((amend, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{amend.name}</h4>
                  <p className="text-sm"><strong>Dosage:</strong> {amend.dosage}</p>
                  <p className="text-sm"><strong>Method:</strong> {amend.application_method}</p>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Benefits:</p>
                    <ul className="text-sm text-muted-foreground">
                      {amend.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Leaf className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="plan" className="mt-4 space-y-4">
              {/* Immediate Actions */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Immediate Actions
                </h4>
                <ul className="space-y-1">
                  {result.improvement_plan?.immediate_actions?.map((action, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Short Term */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-yellow-500" />
                  Short Term (2-4 weeks)
                </h4>
                <ul className="space-y-1">
                  {result.improvement_plan?.short_term?.map((action, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Long Term */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Long Term (Season/Year)
                </h4>
                <ul className="space-y-1">
                  {result.improvement_plan?.long_term?.map((action, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Crop-Specific Advice */}
      {result.crop_specific_advice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              {result.input_data.crop_type} Growing Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Growth Stage Nutrition */}
            {result.crop_specific_advice.growth_stage_nutrition?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Growth Stage Nutrition</h4>
                <div className="space-y-2">
                  {result.crop_specific_advice.growth_stage_nutrition.map((stage, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{stage.stage}</p>
                      <p className="text-sm text-muted-foreground">Focus: {stage.nutrient_focus}</p>
                      <p className="text-sm">{stage.recommended_practice}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yield Tips */}
            {result.crop_specific_advice.yield_optimization_tips?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Yield Optimization Tips</h4>
                <ul className="space-y-1">
                  {result.crop_specific_advice.yield_optimization_tips.map((tip, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
