/**
 * imageValidation.ts
 * Client-side image quality validation using canvas pixel analysis.
 * Runs BEFORE the Cloudinary upload to save bandwidth and API credits.
 *
 * Checks performed:
 *  1. File type  — must be a known image format
 *  2. File size  — between 5 KB and 15 MB
 *  3. Dimensions — minimum 200×200 px
 *  4. Blur       — Laplacian variance; too low = blurry
 *  5. Brightness — average luminance; too dark or overexposed
 *  6. Plant relevance — green pixel ratio; flags non-plant images
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  /** Human-readable error suitable for showing directly in the UI */
  error?: string;
  /** Optional non-blocking warning (informational only) */
  warning?: string;
  /** Metrics collected during validation (for debugging) */
  metrics?: {
    width: number;
    height: number;
    blurScore: number;
    brightness: number;
    greenRatio: number;
  };
}

// ─── Constants (tuned for agricultural leaf images) ───────────────────────────

const MIN_DIMENSION   = 200;          // px — reject tiny / thumbnail images
const MAX_FILE_SIZE   = 15 * 1024 * 1024;  // 15 MB
const MIN_FILE_SIZE   = 5  * 1024;         // 5 KB (avoid empty/corrupt files)
const BLUR_THRESHOLD  = 80;           // Laplacian variance below this = blurry
const MIN_BRIGHTNESS  = 25;           // 0-255 — reject near-black images
const MAX_BRIGHTNESS  = 235;          // 0-255 — reject totally blown-out images
const MIN_GREEN_RATIO = 0.03;         // 3% of pixels should have plant-like hue

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Draw the file to an offscreen canvas and return its ImageData. */
async function fileToImageData(
  file: File,
  sampleSize = 400
): Promise<{ imageData: ImageData; width: number; height: number }> {
  const bitmapSrc = await createImageBitmap(file);
  const scale = Math.min(1, sampleSize / Math.max(bitmapSrc.width, bitmapSrc.height));
  const w = Math.round(bitmapSrc.width * scale);
  const h = Math.round(bitmapSrc.height * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmapSrc, 0, 0, w, h);
  bitmapSrc.close();

  return { imageData: ctx.getImageData(0, 0, w, h), width: bitmapSrc.width, height: bitmapSrc.height };
}

/**
 * Laplacian variance — measures edge sharpness.
 * A sharp image has high variance; a blurry one has low variance.
 * We approximate the 3×3 Laplacian kernel on the grayscale channel.
 */
function computeBlurScore(data: Uint8ClampedArray, w: number, h: number): number {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  let sum = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const lap =
        -gray[(y - 1) * w + x] -
        gray[(y + 1) * w + x] -
        gray[y * w + (x - 1)] -
        gray[y * w + (x + 1)] +
        4 * gray[y * w + x];
      sum += lap * lap;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/** Average luminance across all pixels (0–255). */
function computeBrightness(data: Uint8ClampedArray): number {
  let total = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return total / pixels;
}

/**
 * Fraction of pixels whose hue falls in the "plant green" range.
 * Hue 80°–165° covers leaf greens, grass, lime, and olive tones.
 */
function computeGreenRatio(data: Uint8ClampedArray): number {
  let greenPixels = 0;
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta < 0.05 || max < 0.1) continue; // achromatic or near-black → skip

    let hue = 0;
    if (max === g) {
      hue = 60 * (((b - r) / delta + 2) % 6);
    } else if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
    if (hue < 0) hue += 360;

    // 80° – 165° = plant greens
    if (hue >= 80 && hue <= 165) greenPixels++;
  }

  return greenPixels / total;
}

// ─── Main Validator ───────────────────────────────────────────────────────────

/**
 * Validate an image file before uploading.
 * Returns `{ valid: true }` on success, or `{ valid: false, error: "..." }` on failure.
 */
export async function validateDiagnosisImage(file: File): Promise<ValidationResult> {
  // 1. File type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Unsupported file format. Please upload a JPG, PNG, or WebP image of your plant.",
    };
  }

  // 2. File size
  if (file.size < MIN_FILE_SIZE) {
    return {
      valid: false,
      error:
        "The selected file appears to be empty or corrupt. Please choose a different image.",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error:
        "Image is too large (max 15 MB). Please compress or resize the photo before uploading.",
    };
  }

  // 3 – 6: Canvas-based pixel analysis
  let imageData: ImageData;
  let origWidth: number;
  let origHeight: number;

  try {
    const result = await fileToImageData(file, 400);
    imageData = result.imageData;
    origWidth  = result.width;
    origHeight = result.height;
  } catch {
    return {
      valid: false,
      error:
        "Could not read the image file. It may be corrupt or in an unsupported format.",
    };
  }

  // 3. Minimum dimensions
  if (origWidth < MIN_DIMENSION || origHeight < MIN_DIMENSION) {
    return {
      valid: false,
      error: `Image resolution too low (${origWidth}×${origHeight} px). Please upload at least a 200×200 px photo for accurate disease detection.`,
    };
  }

  const { data, width, height } = imageData;
  const blurScore  = computeBlurScore(data, width, height);
  const brightness = computeBrightness(data);
  const greenRatio = computeGreenRatio(data);

  const metrics = { width: origWidth, height: origHeight, blurScore, brightness, greenRatio };

  // 4. Blur
  if (blurScore < BLUR_THRESHOLD) {
    return {
      valid: false,
      error:
        "Image quality too low for accurate disease diagnosis. The photo appears blurry — please retake it in focus, with good lighting.",
      metrics,
    };
  }

  // 5. Brightness
  if (brightness < MIN_BRIGHTNESS) {
    return {
      valid: false,
      error:
        "The image is too dark for analysis. Please retake the photo in natural light or a well-lit area.",
      metrics,
    };
  }
  if (brightness > MAX_BRIGHTNESS) {
    return {
      valid: false,
      error:
        "The image is overexposed. Please avoid direct sunlight on the lens and retake the photo.",
      metrics,
    };
  }

  // 6. Plant relevance (soft check — low green ratio but not zero = warning, not rejection)
  let warning: string | undefined;
  if (greenRatio < MIN_GREEN_RATIO) {
    // If VERY low, reject (likely a completely irrelevant image)
    if (greenRatio < 0.005) {
      return {
        valid: false,
        error:
          "No plant or leaf detected in the image. Please upload a clear photo of the affected plant part (leaf, stem, or fruit).",
        metrics,
      };
    }
    // Borderline — pass but warn
    warning =
      "Low plant color detected. For best results, ensure the leaf or plant part fills most of the frame.";
  }

  return { valid: true, warning, metrics };
}
