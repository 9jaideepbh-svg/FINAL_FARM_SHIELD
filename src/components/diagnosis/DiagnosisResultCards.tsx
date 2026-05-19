/**
 * DiagnosisResultCards — Premium 6-card UI for Farm Shield diagnosis results.
 * Renders the full Groq-sanitized SanitizedDiagnosis object as beautiful cards.
 *
 * Cards:
 *  1. Plant Identification
 *  2. Disease Detection
 *  3. Confidence Score
 *  4. Treatment Plan
 *  5. Fertilizer Recommendations
 *  6. Prevention & Recovery
 */

import {
  Leaf,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Clock,
  Shield,
  FlaskConical,
  Sprout,
  Activity,
  Info,
  CalendarDays,
  Eye,
  ChevronRight,
  Microscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SanitizedDiagnosis, TreatmentStep, FertilizerCard } from "@/lib/groqDiagnosis";

interface Props {
  diagnosis: SanitizedDiagnosis;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityConfig(severity: string) {
  switch (severity) {
    case "none":
      return {
        label: "None",
        bg: "bg-emerald-500/15",
        text: "text-emerald-500",
        border: "border-emerald-500/30",
        badgeBg: "bg-emerald-500 text-white",
      };
    case "low":
      return {
        label: "Low",
        bg: "bg-green-500/10",
        text: "text-green-600",
        border: "border-green-500/25",
        badgeBg: "bg-green-500 text-white",
      };
    case "medium":
      return {
        label: "Medium",
        bg: "bg-amber-500/10",
        text: "text-amber-600",
        border: "border-amber-500/25",
        badgeBg: "bg-amber-500 text-white",
      };
    case "high":
      return {
        label: "High",
        bg: "bg-orange-500/10",
        text: "text-orange-600",
        border: "border-orange-500/25",
        badgeBg: "bg-orange-500 text-white",
      };
    case "critical":
      return {
        label: "Critical",
        bg: "bg-red-500/10",
        text: "text-red-600",
        border: "border-red-500/25",
        badgeBg: "bg-red-600 text-white",
      };
    default:
      return {
        label: severity,
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-muted",
        badgeBg: "bg-muted text-muted-foreground",
      };
  }
}

function confidenceColor(value: number) {
  if (value >= 80) return "text-emerald-500";
  if (value >= 60) return "text-amber-500";
  return "text-red-500";
}

function confidenceBarColor(value: number) {
  if (value >= 80) return "[&>div]:bg-emerald-500";
  if (value >= 60) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
  accent = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  accent?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-sm font-semibold mb-2", accent)}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function TreatmentList({ steps, color }: { steps: TreatmentStep[]; color: string }) {
  return (
    <ul className="space-y-3">
      {steps.map((step, idx) => (
        <li key={idx} className={cn("flex gap-3 p-3 rounded-xl border", color)}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
            {idx + 1}
          </span>
          <div>
            <p className="font-semibold text-sm">{step.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FertilizerItem({ fert }: { fert: FertilizerCard }) {
  const typeColor =
    fert.type === "organic"
      ? "bg-green-500/10 text-green-700 border-green-500/20"
      : fert.type === "chemical"
      ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
      : "bg-purple-500/10 text-purple-700 border-purple-500/20";

  return (
    <div className="p-4 rounded-xl border border-primary/10 bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{fert.name}</p>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
            typeColor
          )}
        >
          {fert.type}
        </span>
      </div>
      {fert.npk && (
        <p className="text-xs text-muted-foreground">
          NPK Ratio: <span className="font-mono font-semibold">{fert.npk}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-muted-foreground">Dosage: </span>
          <span className="font-medium">{fert.dosage}</span>
        </div>
        <div>
          <span className="text-muted-foreground">When: </span>
          <span className="font-medium">{fert.applicationTime}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">How: </span>
          <span className="font-medium">{fert.applicationMethod}</span>
        </div>
      </div>
      <div className="flex items-start gap-1.5 pt-1 border-t border-muted">
        <Sprout className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">{fert.benefit}</p>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DiagnosisResultCards({ diagnosis }: Props) {
  if (!diagnosis) return null;

  const plant = diagnosis.plantIdentification || {} as SanitizedDiagnosis["plantIdentification"];
  const disease = diagnosis.diseaseDetection || {} as SanitizedDiagnosis["diseaseDetection"];
  const confidence = diagnosis.confidenceScore || {} as SanitizedDiagnosis["confidenceScore"];
  const treatment = diagnosis.treatmentPlan || {} as SanitizedDiagnosis["treatmentPlan"];
  const fertilizers = diagnosis.fertilizerRecommendations || [];
  const prevention = diagnosis.preventionRecovery || {} as SanitizedDiagnosis["preventionRecovery"];
  const diagnosisDate = diagnosis.diagnosisDate || new Date().toISOString();

  const sev = severityConfig(disease.severity || "none");
  const formattedDate = new Date(diagnosisDate).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-5">

      {/* ── HERO STATUS BANNER ──────────────────────────────────────────────── */}
      <Card
        className={cn(
          "overflow-hidden border-2 shadow-xl",
          disease.isHealthy ? "border-emerald-500/40" : "border-red-500/30"
        )}
      >
        <div
          className={cn(
            "p-8 text-white",
            disease.isHealthy
              ? "bg-gradient-to-br from-emerald-500 to-green-700"
              : "bg-gradient-to-br from-red-500 to-rose-700"
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              {disease.isHealthy ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <AlertTriangle className="h-10 w-10" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1 font-medium">
                Plant Identified
              </p>
              <h2 className="text-3xl font-extrabold leading-tight">
                {plant.commonName}
              </h2>
              <p className="text-white/80 italic text-sm mt-0.5">
                {plant.scientificName}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium border border-white/30">
                  {disease.isHealthy ? "✅ Healthy Plant" : `⚠️ ${disease.diseaseName}`}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold border",
                    sev.badgeBg,
                    "bg-white/20 text-white border-white/30"
                  )}
                >
                  <Activity className="h-3.5 w-3.5" />
                  {sev.label} Severity
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium border border-white/30">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">
                Confidence
              </p>
              <p className="text-5xl font-black">{confidence.overallConfidence}%</p>
            </div>
          </div>
        </div>
        {/* Groq summary bar */}
        <div className="px-5 py-3 bg-muted/50 border-t border-border text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          {diagnosis.groqSummary}
        </div>
      </Card>

      {/* ── CARDS GRID (1 & 2) ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card 1 — Plant Identification */}
        <Card className="border border-primary/15 shadow-md hover:shadow-primary/10 transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <Leaf className="h-4 w-4 text-green-600" />
              </div>
              Plant Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-muted">
                <p className="text-xs text-muted-foreground mb-1">Scientific Name</p>
                <p className="text-sm font-semibold italic">{plant.scientificName}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-muted">
                <p className="text-xs text-muted-foreground mb-1">Family</p>
                <p className="text-sm font-semibold">{plant.family}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-muted">
                <p className="text-xs text-muted-foreground mb-1">Genus</p>
                <p className="text-sm font-semibold">{plant.genus}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-muted-foreground mb-1">ID Confidence</p>
                <p className="text-sm font-bold text-green-600">
                  {plant.identificationConfidence}%
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-muted">
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" /> About this plant
              </p>
              <p className="text-sm leading-relaxed">{plant.description}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-semibold text-primary mb-1">💡 Fun Fact</p>
              <p className="text-xs text-muted-foreground">{plant.funFact}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Disease Detection */}
        <Card
          className={cn(
            "border shadow-md transition-shadow",
            disease.isHealthy
              ? "border-emerald-500/20 hover:shadow-emerald-500/10"
              : "border-red-500/20 hover:shadow-red-500/10"
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  disease.isHealthy ? "bg-emerald-500/10" : "bg-red-500/10"
                )}
              >
                <Microscope
                  className={cn(
                    "h-4 w-4",
                    disease.isHealthy ? "text-emerald-600" : "text-red-600"
                  )}
                />
              </div>
              Disease Detection
              <Badge
                className={cn("ml-auto text-xs", sev.badgeBg)}
              >
                {sev.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                "p-4 rounded-xl border text-center",
                sev.bg,
                sev.border
              )}
            >
              <p className={cn("text-lg font-bold", sev.text)}>
                {disease.diseaseName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cause: {disease.cause}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {disease.description}
            </p>

            {disease.affectedParts?.length > 0 && (
              <div>
                <SectionLabel icon={Eye} label="Affected Parts" />
                <div className="flex flex-wrap gap-1.5">
                  {disease.affectedParts.map((part, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs rounded-full bg-muted border border-muted text-muted-foreground"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {disease.symptoms?.length > 0 && (
              <div>
                <SectionLabel icon={Activity} label="Visible Symptoms" accent="text-amber-600" />
                <ul className="space-y-1.5">
                  {disease.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card 3 — Confidence Score ───────────────────────────────────────── */}
      <Card className="border border-primary/15 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            Confidence Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Overall Confidence", value: confidence.overallConfidence },
              { label: "Plant ID (PlantNet)", value: confidence.plantIdConfidence },
              { label: "Disease (Plant.id)", value: confidence.diseaseConfidence },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-muted/40 border border-muted text-center space-y-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-4xl font-black", confidenceColor(value))}>
                  {value}%
                </p>
                <Progress
                  value={value}
                  className={cn("h-2", confidenceBarColor(value))}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{confidence.reliabilityNote}</p>
          </div>
        </CardContent>
      </Card>

      {/* Card 4 — Treatment Plan ─────────────────────────────────────────── */}
      <Card className="border border-orange-500/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
              <Shield className="h-4 w-4 text-orange-600" />
            </div>
            Treatment Plan
            <Badge
              className={cn(
                "ml-auto text-xs",
                treatment.urgencyLevel === "critical"
                  ? "bg-red-600 text-white"
                  : treatment.urgencyLevel === "high"
                  ? "bg-orange-500 text-white"
                  : treatment.urgencyLevel === "medium"
                  ? "bg-amber-500 text-white"
                  : "bg-green-500 text-white"
              )}
            >
              {treatment.urgencyLevel.toUpperCase()} Urgency
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/40 rounded-xl border border-muted italic">
            {treatment.summary}
          </p>
          <Tabs defaultValue="immediate">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="immediate" className="flex items-center gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5" /> Immediate
              </TabsTrigger>
              <TabsTrigger value="short" className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" /> Short-term
              </TabsTrigger>
              <TabsTrigger value="long" className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" /> Long-term
              </TabsTrigger>
            </TabsList>
            <TabsContent value="immediate" className="mt-4">
              {treatment.immediateActions?.length > 0 ? (
                <TreatmentList
                  steps={treatment.immediateActions}
                  color="bg-red-500/5 border-red-500/20 text-red-700"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No immediate actions required.</p>
              )}
            </TabsContent>
            <TabsContent value="short" className="mt-4">
              {treatment.shortTermActions?.length > 0 ? (
                <TreatmentList
                  steps={treatment.shortTermActions}
                  color="bg-amber-500/5 border-amber-500/20 text-amber-700"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No short-term actions listed.</p>
              )}
            </TabsContent>
            <TabsContent value="long" className="mt-4">
              {treatment.longTermActions?.length > 0 ? (
                <TreatmentList
                  steps={treatment.longTermActions}
                  color="bg-green-500/5 border-green-500/20 text-green-700"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No long-term actions listed.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Card 5 — Fertilizer Recommendations ───────────────────────────── */}
      <Card className="border border-green-500/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <FlaskConical className="h-4 w-4 text-green-600" />
            </div>
            Fertilizer Recommendations
            <Badge variant="outline" className="ml-auto border-green-500/30 text-green-600 text-xs">
              {fertilizers.length} recommended
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fertilizers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fertilizers.map((fert, idx) => (
                <FertilizerItem key={idx} fert={fert} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No specific fertilizer recommendations for this diagnosis.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Card 6 — Prevention & Recovery ────────────────────────────────── */}
      <Card className="border border-blue-500/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Sprout className="h-4 w-4 text-blue-600" />
            </div>
            Prevention & Recovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Prevention */}
            <div>
              <SectionLabel icon={Shield} label="Prevention Tips" accent="text-blue-600" />
              <ul className="space-y-2">
                {prevention.preventionTips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            {/* Recovery */}
            <div>
              <SectionLabel icon={Activity} label="Recovery Steps" accent="text-emerald-600" />
              <ul className="space-y-2">
                {prevention.recoverySteps?.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Seasonal Advice */}
          <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <SectionLabel icon={CalendarDays} label="Seasonal Advice (Indian Farming)" accent="text-amber-600" />
            <p className="text-sm text-muted-foreground">{prevention.seasonalAdvice}</p>
          </div>

          {/* Monitoring */}
          <div className="p-4 rounded-xl bg-muted/40 border border-muted">
            <SectionLabel icon={Eye} label="How to Monitor Recovery" />
            <p className="text-sm text-muted-foreground">{prevention.monitoring}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

