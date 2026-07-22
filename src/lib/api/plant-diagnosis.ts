/**
 * Plant Diagnosis API - Direct client-side implementation
 * Replaces Supabase Edge Function
 * Calls PlantNet, Plant.id, and Groq directly from the browser
 */

// API Keys - load from environment variables
const PLANTNET_API_KEY = import.meta.env.VITE_PLANTNET_API_KEY;
const PLANTID_API_KEY = import.meta.env.VITE_PLANTID_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const PLANTID_ENDPOINT = "https://plant.id/api/v3/health_assessment?details=local_name,description,url,treatment,classification,common_names,cause";
const PLANTID_IDENTIFY_ENDPOINT = "https://plant.id/api/v3/identification";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface PlantNetResult {
  results: Array<{
    species: {
      scientificName: string;
      commonNames: string[];
      family?: { scientificName: string };
      genus?: { scientificName: string };
    };
    score: number;
  }>;
}

interface PlantIdResult {
  result: {
    is_healthy: { probability: number };
    disease?: {
      suggestions: Array<{
        name: string;
        probability: number;
        details?: {
          description: string;
          treatment?: {
            biological: string[];
            chemical: string[];
            prevention: string[];
          };
          classification: string[];
          common_names: string[];
        };
      }>;
    };
  };
}

// ─── PlantNet Identification ──────────────────────────────────────────────────
async function identifyWithPlantNet(imageBase64: string): Promise<PlantNetResult> {
  console.log("[PlantNet] Starting plant identification...");

  if (!PLANTNET_API_KEY) {
    throw new Error("PLANTNET_API_KEY is not configured. Add VITE_PLANTNET_API_KEY to your .env file.");
  }

  const endpoint = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&include-related-images=false`;

  let blob: Blob;
  try {
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    blob = new Blob([byteNumbers], { type: "image/jpeg" });
    console.log("[PlantNet] Base64 decoded to blob, size:", blob.size, "bytes");
  } catch (decodeErr) {
    throw new Error(`Base64 decode failed: ${decodeErr instanceof Error ? decodeErr.message : String(decodeErr)}`);
  }

  const formData = new FormData();
  formData.append("images", blob, "plant_image.jpg");
  formData.append("organs", "leaf");

  console.log("[PlantNet] Sending request...");
  const res = await fetch(endpoint, { method: "POST", body: formData });

  console.log("[PlantNet] Response status:", res.status);

  if (!res.ok) {
    const txt = await res.text().catch(() => "(no body)");
    console.error("[PlantNet] Error body:", txt);
    throw new Error(`PlantNet API error (${res.status}): ${txt}`);
  }

  const json = (await res.json()) as PlantNetResult;
  console.log("[PlantNet] Success. Top result:", json?.results?.[0]?.species?.scientificName ?? "N/A");
  return json;
}

// ─── Plant.id Health Assessment ───────────────────────────────────────────────
async function assessWithPlantId(imageBase64: string): Promise<PlantIdResult> {
  console.log("[Plant.id] Starting health assessment...");

  if (!PLANTID_API_KEY) {
    throw new Error("PLANTID_API_KEY is not configured. Add VITE_PLANTID_API_KEY to your .env file.");
  }

  const body = {
    images: [`data:image/jpeg;base64,${imageBase64}`],
    health: "only",
    similar_images: true,
  };

  console.log("[Plant.id] Sending request...");
  const res = await fetch(PLANTID_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PLANTID_API_KEY,
    },
    body: JSON.stringify(body),
  });

  console.log("[Plant.id] Response status:", res.status);

  if (!res.ok) {
    const txt = await res.text().catch(() => "(no body)");
    console.error("[Plant.id] Error body:", txt);
    throw new Error(`Plant.id API error (${res.status}): ${txt}`);
  }

  const json = (await res.json()) as PlantIdResult;
  const isHealthy = (json?.result?.is_healthy?.probability ?? 0) > 0.5;
  console.log("[Plant.id] Success. is_healthy:", isHealthy);
  return json;
}

// ─── Plant.id Identification Fallback ──────────────────────────────────────────
async function identifyWithPlantId(imageBase64: string): Promise<PlantIdResult> {
  console.log("[Plant.id-ID] PlantNet failed — falling back to Plant.id identification...");

  const body = {
    images: [`data:image/jpeg;base64,${imageBase64}`],
    similar_images: false,
  };

  const res = await fetch(PLANTID_IDENTIFY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PLANTID_API_KEY,
    },
    body: JSON.stringify(body),
  });

  console.log("[Plant.id-ID] Response status:", res.status);

  if (!res.ok) {
    const txt = await res.text().catch(() => "(no body)");
    console.error("[Plant.id-ID] Error body:", txt);
    throw new Error(`Plant.id identification API error (${res.status}): ${txt}`);
  }

  return (await res.json()) as PlantIdResult;
}

// ─── Parse PlantNet ───────────────────────────────────────────────────────────
function parsePlantNet(data: PlantNetResult) {
  const results = data.results;
  const best = results?.[0];
  if (!best) {
    console.warn("[PlantNet] No results found, using Unknown defaults.");
    return { scientificName: "Unknown", commonNames: ["Unknown plant"], family: "Unknown", genus: "Unknown", confidence: 0 };
  }
  const species = best.species;
  return {
    scientificName: species?.scientificName ?? "Unknown",
    commonNames: species?.commonNames ?? ["Unknown plant"],
    family: species?.family?.scientificName ?? "Unknown",
    genus: species?.genus?.scientificName ?? "Unknown",
    confidence: Math.round((best.score ?? 0) * 100),
  };
}

// ─── Parse Plant.id ───────────────────────────────────────────────────────────
function parsePlantId(data: PlantIdResult) {
  const result = data.result;
  const isHealthy = (result?.is_healthy?.probability ?? 0) > 0.5;
  const healthProbability = Math.round((result?.is_healthy?.probability ?? 0) * 100);
  const disease = result?.disease;
  const suggestions = disease?.suggestions ?? [];
  const top = suggestions[0];
  return {
    isHealthy,
    healthProbability,
    topDiseaseName: top?.name ?? "None detected",
    topDiseaseConfidence: Math.round((top?.probability ?? 0) * 100),
    topDiseaseDescription: top?.details?.description ?? "",
    biological: top?.details?.treatment?.biological ?? [],
    chemical: top?.details?.treatment?.chemical ?? [],
    prevention: top?.details?.treatment?.prevention ?? [],
    classification: top?.details?.classification ?? [],
    commonDiseaseNames: top?.details?.common_names ?? [],
  };
}

// ─── Parse Plant.id Identification result ──────────────────────────────────────
function parsePlantIdIdentification(data: PlantIdResult) {
  const result = data.result;
  const suggestions = (result?.classification?.suggestions as Array<Record<string, unknown>>) ?? [];
  const best = suggestions[0];
  const commonNames = (best?.details as Record<string, unknown>)?.common_names as string[] ?? [];
  const taxonomy = (best?.details as Record<string, unknown>)?.taxonomy as Record<string, unknown> ?? {};

  return {
    scientificName: (best?.name as string) ?? "Unknown",
    commonNames: commonNames.length > 0 ? commonNames : [(best?.name as string) ?? "Unknown plant"],
    family: (taxonomy?.family as string) ?? "Unknown",
    genus: (taxonomy?.genus as string) ?? "Unknown",
    confidence: Math.round(((best?.probability as number) ?? 0) * 100),
  };
}

// ─── Groq sanitization ────────────────────────────────────────────────────────
async function sanitizeWithGroq(
  plantNet: ReturnType<typeof parsePlantNet>,
  plantId: ReturnType<typeof parsePlantId>
): Promise<Record<string, unknown>> {
  console.log("[Groq] Starting sanitization with Llama-3.3-70b...");

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured. Add VITE_GROQ_API_KEY to your .env file.");
  }

  const rawContext = `
PLANT IDENTIFICATION (PlantNet):
- Scientific Name: ${plantNet.scientificName}
- Common Names: ${plantNet.commonNames.join(", ")}
- Family: ${plantNet.family}
- Genus: ${plantNet.genus}
- Identification Confidence: ${plantNet.confidence}%

HEALTH ASSESSMENT (Plant.id):
- Is Healthy: ${plantId.isHealthy}
- Health Probability: ${plantId.healthProbability}%
- Top Disease: ${plantId.topDiseaseName}
- Disease Confidence: ${plantId.topDiseaseConfidence}%
- Disease Description: ${plantId.topDiseaseDescription}
- Biological Treatments: ${plantId.biological.join("; ") || "N/A"}
- Chemical Treatments: ${plantId.chemical.join("; ") || "N/A"}
- Prevention: ${plantId.prevention.join("; ") || "N/A"}
- Classification: ${plantId.classification.join(" > ") || "N/A"}
- Common Disease Names: ${plantId.commonDiseaseNames.join(", ") || "N/A"}
`.trim();

  const systemPrompt = `You are an expert agricultural AI assistant for Farm Shield — an AI-powered farming app used by Indian farmers.
You receive raw plant identification and disease diagnosis data from scientific APIs and transform it into clear, friendly, actionable guidance.
Be natural, helpful, and intelligent. Always think from the perspective of a farmer who needs practical help, not scientific jargon.
Respond ONLY with a valid JSON object matching the exact structure requested. No markdown, no code fences, no explanations outside JSON.`;

  const userPrompt = `Here is the raw diagnosis data:

${rawContext}

Return a JSON object with exactly this structure:
{
  "plantIdentification": {
    "scientificName": "string",
    "commonName": "string",
    "family": "string",
    "genus": "string",
    "identificationConfidence": number,
    "description": "2-3 sentence farmer-friendly description",
    "funFact": "1 interesting fact"
  },
  "diseaseDetection": {
    "diseaseName": "string",
    "isHealthy": boolean,
    "severity": "none|low|medium|high|critical",
    "affectedParts": ["array"],
    "symptoms": ["3-5 symptoms"],
    "cause": "brief cause",
    "description": "2-3 sentence explanation"
  },
  "confidenceScore": {
    "overallConfidence": number,
    "plantIdConfidence": number,
    "diseaseConfidence": number,
    "reliabilityNote": "short note"
  },
  "treatmentPlan": {
    "immediateActions": [{"label": "string", "detail": "string"}],
    "shortTermActions": [{"label": "string", "detail": "string"}],
    "longTermActions": [{"label": "string", "detail": "string"}],
    "urgencyLevel": "low|medium|high|critical",
    "summary": "1-sentence summary"
  },
  "fertilizerRecommendations": [
    {
      "name": "string",
      "type": "organic|chemical|biostimulant",
      "npk": "string or null",
      "dosage": "string",
      "applicationTime": "string",
      "applicationMethod": "string",
      "benefit": "string"
    }
  ],
  "preventionRecovery": {
    "preventionTips": ["4-5 tips"],
    "recoverySteps": ["3-4 steps"],
    "seasonalAdvice": "India-specific advice",
    "monitoring": "how to monitor recovery"
  },
  "groqSummary": "One sentence history card summary"
}

Return ONLY the JSON object. No extra text, no markdown fences.`;

  console.log("[Groq] Sending request...");
  const res = await fetch(GROQ_ENDPOINT, {
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

  console.log("[Groq] Response status:", res.status);

  if (!res.ok) {
    const txt = await res.text().catch(() => "(no body)");
    console.error("[Groq] Error body:", txt);
    throw new Error(`Groq API error (${res.status}): ${txt}`);
  }

  const groqData = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const content: string = groqData.choices?.[0]?.message?.content ?? "";
  console.log("[Groq] Raw content (first 200 chars):", content.slice(0, 200));

  const clean = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(clean);
    console.log("[Groq] JSON parsed successfully.");
  } catch (parseErr) {
    console.error("[Groq] JSON parse failed:", parseErr, "Raw content:", clean);
    parsed = {
      plantIdentification: {
        scientificName: plantNet.scientificName,
        commonName: plantNet.commonNames[0] ?? "Unknown",
        family: plantNet.family,
        genus: plantNet.genus,
        identificationConfidence: plantNet.confidence,
        description: "Diagnosis data was retrieved but could not be formatted by AI.",
        funFact: "N/A",
      },
      diseaseDetection: {
        diseaseName: plantId.topDiseaseName,
        isHealthy: plantId.isHealthy,
        severity: plantId.isHealthy ? "none" : "medium",
        affectedParts: ["Leaf"],
        symptoms: ["See raw API data"],
        cause: plantId.topDiseaseDescription || "Unknown",
        description: `Disease confidence: ${plantId.topDiseaseConfidence}%.`,
      },
      confidenceScore: {
        overallConfidence: plantNet.confidence,
        plantIdConfidence: plantNet.confidence,
        diseaseConfidence: plantId.topDiseaseConfidence,
        reliabilityNote: "Groq formatting failed — data is unformatted.",
      },
      treatmentPlan: {
        immediateActions: [{ label: "Consult expert", detail: "AI formatting failed. Please consult a local agricultural expert." }],
        shortTermActions: [],
        longTermActions: [],
        urgencyLevel: "medium",
        summary: "AI response could not be parsed. Manual review recommended.",
      },
      fertilizerRecommendations: [],
      preventionRecovery: {
        preventionTips: ["Consult local Krishi Kendra for advice."],
        recoverySteps: ["Manual inspection recommended."],
        seasonalAdvice: "N/A",
        monitoring: "N/A",
      },
      groqSummary: `${plantNet.commonNames[0] ?? plantNet.scientificName} diagnosed — ${plantId.isHealthy ? "healthy" : plantId.topDiseaseName}.`,
    };
  }

  return parsed;
}

// ─── Main API Function ────────────────────────────────────────────────────────
export async function diagnoseWithPlantAPI(imageBase64: string): Promise<Record<string, unknown>> {
  console.log("[plant-diagnosis] ===== Request started =====");
  console.log("[plant-diagnosis] Time:", new Date().toISOString());

  if (!imageBase64 || imageBase64.length < 100) {
    throw new Error("imageBase64 is required and must be a valid base64 image string.");
  }

  // ── Step 1 + 2: PlantNet & Plant.id in PARALLEL ───────────────────────────
  console.log("[plant-diagnosis] Firing PlantNet + Plant.id in parallel...");
  const t0 = Date.now();

  let plantNetParsed: ReturnType<typeof parsePlantNet>;
  let plantIdParsed: ReturnType<typeof parsePlantId>;

  const [plantNetResult, plantIdResult] = await Promise.allSettled([
    identifyWithPlantNet(imageBase64),
    assessWithPlantId(imageBase64),
  ]);

  console.log(`[plant-diagnosis] Parallel APIs done in ${Date.now() - t0}ms`);

  // Handle PlantNet result (with Plant.id fallback)
  if (plantNetResult.status === "fulfilled") {
    plantNetParsed = parsePlantNet(plantNetResult.value);
    console.log("[plant-diagnosis] PlantNet:", plantNetParsed.scientificName, `(${plantNetParsed.confidence}%)`);
  } else {
    console.warn("[plant-diagnosis] PlantNet failed:", (plantNetResult as PromiseRejectedResult).reason?.message);
    // Fallback: try Plant.id identification
    try {
      const fallback = await identifyWithPlantId(imageBase64);
      plantNetParsed = parsePlantIdIdentification(fallback);
      console.log("[plant-diagnosis] Plant.id ID fallback:", plantNetParsed.scientificName);
    } catch (fallbackErr) {
      console.error("[plant-diagnosis] Both identification APIs failed:", fallbackErr);
      plantNetParsed = { scientificName: "Unknown", commonNames: ["Unknown plant"], family: "Unknown", genus: "Unknown", confidence: 0 };
    }
  }

  // Handle Plant.id result
  if (plantIdResult.status === "fulfilled") {
    plantIdParsed = parsePlantId(plantIdResult.value);
    console.log("[plant-diagnosis] Plant.id: isHealthy=", plantIdParsed.isHealthy, "disease=", plantIdParsed.topDiseaseName);
  } else {
    throw new Error(`Plant.id step failed: ${(plantIdResult as PromiseRejectedResult).reason?.message}`);
  }

  // ── Step 3: Groq ───────────────────────────────────────────────────────────
  let sanitized: Record<string, unknown>;
  try {
    sanitized = await sanitizeWithGroq(plantNetParsed, plantIdParsed);
  } catch (err) {
    throw new Error(`Groq step failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  sanitized.diagnosisDate = new Date().toISOString();
  console.log("[plant-diagnosis] ===== Pipeline complete =====");

  return sanitized;
}
