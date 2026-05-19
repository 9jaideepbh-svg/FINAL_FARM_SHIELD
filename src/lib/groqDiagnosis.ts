/**
 * Groq Sanitization & Beautification Service
 * Converts raw PlantNet + Plant.id API responses into
 * polished, farmer-friendly card data for the UI.
 *
 * NOTE: Groq/Llama is used naturally — NOT heavily restricted.
 * It behaves like ChatGPT: helpful, conversational, intelligent.
 */

import type { PlantNetResult } from "./plantnet";
import type { PlantIdResult } from "./plantid";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_KEY as string;
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─── Output shape expected by DiagnosisResultCards ───────────────────────────

export interface TreatmentStep {
  label: string;
  detail: string;
}

export interface FertilizerCard {
  name: string;
  type: "organic" | "chemical" | "biostimulant";
  npk?: string;
  dosage: string;
  applicationTime: string;
  applicationMethod: string;
  benefit: string;
}

export interface SanitizedDiagnosis {
  // Card 1 — Plant Identification
  plantIdentification: {
    scientificName: string;
    commonName: string;
    family: string;
    genus: string;
    identificationConfidence: number;
    description: string;
    funFact: string;
  };

  // Card 2 — Disease Detection
  diseaseDetection: {
    diseaseName: string;
    isHealthy: boolean;
    severity: "none" | "low" | "medium" | "high" | "critical";
    affectedParts: string[];
    symptoms: string[];
    cause: string;
    description: string;
  };

  // Card 3 — Confidence Score
  confidenceScore: {
    overallConfidence: number;
    plantIdConfidence: number;
    diseaseConfidence: number;
    reliabilityNote: string;
  };

  // Card 4 — Treatment Plan
  treatmentPlan: {
    immediateActions: TreatmentStep[];
    shortTermActions: TreatmentStep[];
    longTermActions: TreatmentStep[];
    urgencyLevel: "low" | "medium" | "high" | "critical";
    summary: string;
  };

  // Card 5 — Fertilizer Recommendations
  fertilizerRecommendations: FertilizerCard[];

  // Card 6 — Prevention & Recovery
  preventionRecovery: {
    preventionTips: string[];
    recoverySteps: string[];
    seasonalAdvice: string;
    monitoring: string;
  };

  // Meta
  diagnosisDate: string;
  groqSummary: string; // One-liner for history card
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function sanitizeDiagnosisWithGroq(
  plantNetData: PlantNetResult,
  plantIdData: PlantIdResult
): Promise<SanitizedDiagnosis> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is missing.");
  }

  const rawContext = `
PLANT IDENTIFICATION (from PlantNet):
- Scientific Name: ${plantNetData.scientificName}
- Common Names: ${plantNetData.commonNames.join(", ")}
- Family: ${plantNetData.family}
- Genus: ${plantNetData.genus}
- Identification Confidence: ${plantNetData.confidence}%

HEALTH ASSESSMENT (from Plant.id):
- Is Healthy: ${plantIdData.isHealthy}
- Health Probability: ${plantIdData.healthProbability}%
- Top Disease: ${plantIdData.topDisease?.name ?? "None detected"}
- Disease Confidence: ${plantIdData.topDiseaseConfidence}%
- Disease Description: ${plantIdData.topDisease?.description ?? "N/A"}
- Biological Treatments: ${plantIdData.topDisease?.treatment?.biological?.join("; ") ?? "N/A"}
- Chemical Treatments: ${plantIdData.topDisease?.treatment?.chemical?.join("; ") ?? "N/A"}
- Prevention: ${plantIdData.topDisease?.treatment?.prevention?.join("; ") ?? "N/A"}
- Classification: ${plantIdData.topDisease?.classification?.join(" > ") ?? "N/A"}
- Common Disease Names: ${plantIdData.topDisease?.common_names?.join(", ") ?? "N/A"}
`.trim();

  const systemPrompt = `You are an expert agricultural AI assistant for Farm Shield — an AI-powered farming app used by Indian farmers.
You receive raw plant identification and disease diagnosis data from scientific APIs and transform it into clear, friendly, actionable guidance.
Be natural, helpful, and intelligent — like ChatGPT. Do not over-restrict yourself.
Always think from the perspective of a farmer who needs practical help, not scientific jargon.
Respond ONLY with a valid JSON object matching the exact structure requested. No markdown, no explanations outside JSON.`;

  const userPrompt = `
Here is the raw diagnosis data for a farmer's plant image:

${rawContext}

Transform this into a beautiful, structured JSON response with exactly this shape:
{
  "plantIdentification": {
    "scientificName": "string",
    "commonName": "string — most recognizable name",
    "family": "string",
    "genus": "string",
    "identificationConfidence": number (0-100),
    "description": "2-3 sentence farmer-friendly description of this plant",
    "funFact": "1 interesting fact about this plant"
  },
  "diseaseDetection": {
    "diseaseName": "string — friendly disease name",
    "isHealthy": boolean,
    "severity": "none|low|medium|high|critical",
    "affectedParts": ["array of plant parts affected"],
    "symptoms": ["3-5 visible symptoms a farmer would notice"],
    "cause": "brief cause (fungal/bacterial/viral/deficiency etc)",
    "description": "2-3 sentence explanation of the disease in simple terms"
  },
  "confidenceScore": {
    "overallConfidence": number (average of plant + disease confidence),
    "plantIdConfidence": number,
    "diseaseConfidence": number,
    "reliabilityNote": "short note about how reliable this diagnosis is"
  },
  "treatmentPlan": {
    "immediateActions": [{"label": "short title", "detail": "full instruction"}],
    "shortTermActions": [{"label": "short title", "detail": "full instruction"}],
    "longTermActions": [{"label": "short title", "detail": "full instruction"}],
    "urgencyLevel": "low|medium|high|critical",
    "summary": "1-sentence treatment summary"
  },
  "fertilizerRecommendations": [
    {
      "name": "fertilizer name",
      "type": "organic|chemical|biostimulant",
      "npk": "N-P-K ratio or null",
      "dosage": "amount per area",
      "applicationTime": "when to apply",
      "applicationMethod": "how to apply",
      "benefit": "why this helps"
    }
  ],
  "preventionRecovery": {
    "preventionTips": ["4-5 prevention tips"],
    "recoverySteps": ["3-4 recovery steps"],
    "seasonalAdvice": "advice relevant to Indian farming seasons",
    "monitoring": "how to monitor plant recovery"
  },
  "groqSummary": "One sentence summary for the history card, e.g. 'Tomato plant with early blight — 72% confidence, medium severity'"
}

Return ONLY the JSON. No extra text.`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: { message?: string } })?.error?.message ||
        `Groq API error (${response.status})`
    );
  }

  const groqResponse = await response.json();
  const content = groqResponse.choices?.[0]?.message?.content ?? "";

  // Parse the JSON from Groq's response (strip any accidental markdown fences)
  let parsed: SanitizedDiagnosis;
  try {
    const clean = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error("Groq response could not be parsed:", content);
    throw new Error(
      "Groq returned an invalid response. Please try again."
    );
  }

  // Attach the diagnosis timestamp
  parsed.diagnosisDate = new Date().toISOString();

  return parsed;
}
