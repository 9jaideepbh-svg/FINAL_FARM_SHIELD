/**
 * Cloudinary Upload Service
 * Uses unsigned upload preset "farmshield_diagnosis"
 *
 * PIPELINE:
 *  1. uploadToCloudinary()       → uploads raw image, returns original URL + metadata
 *  2. getEnhancedUrl()           → transforms URL with AI enhancement params (server-side, no extra API call)
 *  3. urlToBase64()              → fetches the enhanced image and converts to raw base64 for PlantNet / Plant.id
 *
 * AI Transformations applied (Cloudinary server-side, non-destructive):
 *   q_auto   - smart quality compression
 *   f_auto   - modern format (WebP / AVIF)
 *   e_enhance - auto exposure / contrast / colour correction
 *   e_sharpen:50 - edge sharpening (helps disease spot detection)
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  /** Original, un-transformed URL (stored in Firestore / shown in history) */
  url: string;
  /** AI-enhanced URL ready for PlantNet + Plant.id APIs */
  enhancedUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Injects Cloudinary AI transformation params into an existing upload URL.
 * Transforms:  /upload/
 * Into:        /upload/q_auto,f_auto,e_enhance,e_sharpen:50/
 *
 * Cloudinary generates the enhanced variant on first fetch and caches it on CDN.
 * The original image is preserved unchanged.
 */
export function getEnhancedUrl(originalUrl: string): string {
  return originalUrl.replace(
    "/upload/",
    "/upload/q_auto,f_auto,e_enhance,e_sharpen:50/"
  );
}

/**
 * Fetches an image from a URL and converts it to a raw base64 string
 * (no data-URI prefix — PlantNet and Plant.id need raw base64).
 *
 * This replaces the old fileToBase64(file) pattern. We now fetch the
 * Cloudinary-enhanced image so the AI APIs receive the improved version.
 */
export async function urlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch enhanced image for base64 conversion: ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Failed to read enhanced image as base64"));
    reader.readAsDataURL(blob);
  });
}

// ─── Main Upload ──────────────────────────────────────────────────────────────

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing from environment variables.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "farmshield/diagnosis");

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Cloudinary upload failed: ${response.status}`
    );
  }

  const data = await response.json();
  const originalUrl = data.secure_url as string;

  return {
    url: originalUrl,
    enhancedUrl: getEnhancedUrl(originalUrl),
    publicId: data.public_id as string,
    format: data.format as string,
    width: data.width as number,
    height: data.height as number,
  };
}

/**
 * Converts a local File to raw base64 (no data-URI prefix).
 * Called immediately when the user selects an image so the result is
 * pre-computed and ready before the Cloudinary upload completes.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Failed to read file as base64"));
    reader.readAsDataURL(file);
  });
}
