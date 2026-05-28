/**
 * PlantNet API Service
 * Identifies the plant species/common name BEFORE disease diagnosis
 * Sends image as base64 (required by architecture)
 * API: https://my-api.plantnet.org/v2/identify/all
 */

// NOTE: PlantNet identification is handled server-side in the plant-diagnosis Supabase Edge Function.
// The PLANTNET_API_KEY must NOT be set here — it lives only in Supabase secret storage.
const PLANTNET_API_KEY = ""; // intentionally empty — see supabase/functions/plant-diagnosis/index.ts


export interface PlantNetResult {
  scientificName: string;
  commonNames: string[];
  family: string;
  genus: string;
  confidence: number; // 0-100
  rawScore: number;   // 0-1 from API
}

export async function identifyPlantWithPlantNet(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<PlantNetResult> {
  if (!PLANTNET_API_KEY) {
    throw new Error("PlantNet API key is missing.");
  }

  // PlantNet v2 API accepts base64 images via multipart or data URI
  // We'll use the organs=leaf as default (best for disease diagnosis context)
  const endpoint = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&include-related-images=false`;

  // Convert base64 back to blob for FormData (PlantNet prefers multipart)
  const byteCharacters = atob(imageBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const formData = new FormData();
  formData.append("images", blob, "plant_image.jpg");
  formData.append("organs", "leaf");

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `PlantNet API error (${response.status}): ${errText || response.statusText}`
    );
  }

  const data = await response.json();

  // PlantNet returns an array of results sorted by score descending
  const bestMatch = data.results?.[0];
  if (!bestMatch) {
    throw new Error("PlantNet could not identify any plant in the image.");
  }

  const species = bestMatch.species;
  return {
    scientificName: species.scientificName || "Unknown",
    commonNames: species.commonNames?.length
      ? species.commonNames
      : ["Unknown plant"],
    family: species.family?.scientificName || "Unknown family",
    genus: species.genus?.scientificName || "Unknown genus",
    confidence: Math.round((bestMatch.score || 0) * 100),
    rawScore: bestMatch.score || 0,
  };
}
