/**
 * Plant.id API Service — Health Assessment
 * Endpoint: https://plant.id/api/v3/health_assessment
 * Sends image as base64 (mandatory per architecture doc)
 * Returns: disease name, confidence, severity, treatments, fertilizer recs
 */

const PLANTID_API_KEY = import.meta.env.VITE_PLANTID_API_KEY as string;
const PLANTID_ENDPOINT = "https://plant.id/api/v3/health_assessment";

export interface PlantIdDisease {
  name: string;
  probability: number;    // 0-1
  description?: string;
  treatment?: {
    biological?: string[];
    chemical?: string[];
    prevention?: string[];
  };
  classification?: string[];
  common_names?: string[];
}

export interface PlantIdResult {
  isHealthy: boolean;
  healthProbability: number; // 0-100
  diseases: PlantIdDisease[];
  topDisease: PlantIdDisease | null;
  topDiseaseConfidence: number; // 0-100
  plantName: string;
  rawResult: Record<string, unknown>;
}

export async function assessPlantHealth(
  imageBase64: string,
  identifiedPlantName: string = "plant"
): Promise<PlantIdResult> {
  if (!PLANTID_API_KEY) {
    throw new Error("Plant.id API key is missing.");
  }

  const requestBody = {
    images: [`data:image/jpeg;base64,${imageBase64}`],
    // Include detailed health data
    health: "all",
    disease_details: [
      "description",
      "treatment",
      "classification",
      "common_names",
      "cause",
    ],
    language: "en",
    similar_images: false,
  };

  const response = await fetch(PLANTID_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PLANTID_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message ||
        `Plant.id API error (${response.status}): ${response.statusText}`
    );
  }

  const data = await response.json();

  // Parse the health assessment result
  const healthAssessment = data.result?.disease ?? data.result?.health_assessment;
  const isHealthy = data.result?.is_healthy?.probability > 0.5 ?? false;
  const healthProbability = Math.round((data.result?.is_healthy?.probability ?? 0) * 100);

  // Extract disease suggestions
  const diseaseSuggestions: PlantIdDisease[] = (
    healthAssessment?.suggestions ?? []
  ).map((s: Record<string, unknown>) => ({
    name: (s.name as string) || "Unknown disease",
    probability: (s.probability as number) || 0,
    description: (s.details as Record<string, unknown>)?.description as string | undefined,
    treatment: (s.details as Record<string, unknown>)?.treatment as PlantIdDisease["treatment"],
    classification: (s.details as Record<string, unknown>)?.classification as string[] | undefined,
    common_names: (s.details as Record<string, unknown>)?.common_names as string[] | undefined,
  }));

  const topDisease = diseaseSuggestions.length > 0 ? diseaseSuggestions[0] : null;

  return {
    isHealthy,
    healthProbability,
    diseases: diseaseSuggestions,
    topDisease,
    topDiseaseConfidence: topDisease
      ? Math.round(topDisease.probability * 100)
      : 0,
    plantName: identifiedPlantName,
    rawResult: data,
  };
}
