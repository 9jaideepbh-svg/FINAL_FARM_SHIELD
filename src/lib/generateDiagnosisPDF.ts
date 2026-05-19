import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { DiagnosisHistoryRecord } from "./diagnosisHistory";

// --- Color Constants (premium HSL-aligned palette) ---
const PRIMARY_GREEN = rgb(0.18, 0.49, 0.20);     // #2E7D32
const SOFT_GREEN = rgb(0.91, 0.96, 0.91);        // #E8F5E9
const AMBER_ACCENT = rgb(0.77, 0.55, 0.22);      // #C58B39
const SOFT_AMBER = rgb(0.98, 0.95, 0.88);       // #FCF6E8
const DANGER_RED = rgb(0.83, 0.18, 0.18);        // #D32F2F
const SOFT_RED = rgb(0.98, 0.92, 0.92);          // #FDEAEA
const INFO_BLUE = rgb(0.12, 0.45, 0.74);         // #1E73BE
const SOFT_BLUE = rgb(0.92, 0.95, 0.98);        // #F0F5FA
const TEXT_PRIMARY = rgb(0.10, 0.10, 0.10);      // #1A1A1A
const TEXT_SECONDARY = rgb(0.42, 0.45, 0.50);    // #6B7280
const BORDER_MUTED = rgb(0.90, 0.91, 0.92);      // #ECECEC
const WHITE = rgb(1.0, 1.0, 1.0);
const BG_OFF_WHITE = rgb(0.98, 0.98, 0.98);      // #FAFAFA

// --- Stable Font URLs ---
const FONT_REGULAR_URL = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf";
const FONT_BOLD_URL = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf";

// --- Types for local layout helpers ---
interface DrawCardOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor?: typeof WHITE;
  borderColor?: typeof BORDER_MUTED;
  borderRadius?: number;
}

export async function generateDiagnosisPDF(
  record: DiagnosisHistoryRecord
): Promise<void> {
  const diagnosis = record.groqResponse;
  if (!diagnosis) {
    throw new Error("Diagnosis data is missing the full AI response.");
  }

  // 1. Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 2. Load Fonts (with robust Helvetica standard fallbacks if fetching fails)
  let fontRegular: PDFFont;
  let fontBold: PDFFont;

  try {
    const [regBytes, boldBytes] = await Promise.all([
      fetch(FONT_REGULAR_URL).then(res => {
        if (!res.ok) throw new Error("Regular font load failed");
        return res.arrayBuffer();
      }),
      fetch(FONT_BOLD_URL).then(res => {
        if (!res.ok) throw new Error("Bold font load failed");
        return res.arrayBuffer();
      })
    ]);
    fontRegular = await pdfDoc.embedFont(regBytes);
    fontBold = await pdfDoc.embedFont(boldBytes);
  } catch (err) {
    console.warn("[PDF] Failed to load Inter font from CDN. Falling back to Helvetica.", err);
    fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  // 3. Try fetching and embedding the Cloudinary plant image
  let plantImg: PDFImage | null = null;
  if (record.imageUrl) {
    try {
      // Optimize image URL for PDF embed by asking Cloudinary for a 600px width JPG
      let optimizedUrl = record.imageUrl;
      if (optimizedUrl.includes("/upload/")) {
        optimizedUrl = optimizedUrl.replace("/upload/", "/upload/w_600,c_scale,q_80,f_jpg/");
      }
      const imgBytes = await fetch(optimizedUrl).then(res => {
        if (!res.ok) throw new Error("Failed to download image");
        return res.arrayBuffer();
      });
      plantImg = await pdfDoc.embedJpg(imgBytes);
    } catch (err) {
      console.warn("[PDF] Could not embed Cloudinary image, using vector placeholder card.", err);
    }
  }

  // 3b. Try fetching and embedding the logo (favicon.ico)
  let logoImg: PDFImage | null = null;
  try {
    const logoResponse = await fetch("/favicon.ico");
    if (logoResponse.ok) {
      const icoBuffer = await logoResponse.arrayBuffer();
      const view = new DataView(icoBuffer);
      // ICO magic Check: reserved = 0, type = 1
      if (view.byteLength >= 6 && view.getUint16(0, true) === 0 && view.getUint16(2, true) === 1) {
        const numImages = view.getUint16(4, true);
        if (numImages > 0) {
          let pngOffset = 0;
          let pngSize = 0;
          for (let i = 0; i < numImages; i++) {
            const entryOffset = 6 + i * 16;
            if (entryOffset + 16 <= view.byteLength) {
              const size = view.getUint32(entryOffset + 8, true);
              const dataOffset = view.getUint32(entryOffset + 12, true);
              if (dataOffset + 8 <= icoBuffer.byteLength) {
                const u8 = new Uint8Array(icoBuffer, dataOffset, 8);
                const isPng = u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47;
                if (isPng) {
                  pngOffset = dataOffset;
                  pngSize = size;
                  break;
                }
              }
              if (i === 0) {
                pngOffset = dataOffset;
                pngSize = size;
              }
            }
          }
          if (pngOffset > 0 && pngSize > 0 && pngOffset + pngSize <= icoBuffer.byteLength) {
            const pngBytes = new Uint8Array(icoBuffer.slice(pngOffset, pngOffset + pngSize));
            logoImg = await pdfDoc.embedPng(pngBytes);
          }
        }
      } else if (view.byteLength >= 4) {
        const u8 = new Uint8Array(icoBuffer, 0, 4);
        const isPng = u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47;
        if (isPng) {
          logoImg = await pdfDoc.embedPng(new Uint8Array(icoBuffer));
        } else {
          logoImg = await pdfDoc.embedJpg(new Uint8Array(icoBuffer));
        }
      }
    }
  } catch (err) {
    console.warn("[PDF] Could not embed logo image from favicon.ico:", err);
  }

  // 4. Page layout config
  const PAGE_WIDTH = 595.27; // A4 Width
  const PAGE_HEIGHT = 841.89; // A4 Height
  const MARGIN = 35;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 525.27

  // Helper: Wrap text utility
  const wrapText = (text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] => {
    if (!text) return [];
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Helper: Draw Card Background & Borders
  const drawCard = (page: any, options: DrawCardOptions) => {
    const { x, y, width, height, bgColor = WHITE, borderColor = BORDER_MUTED, borderRadius = 16 } = options;
    // Draw soft card shadow first
    page.drawRectangle({
      x: x + 1,
      y: y - 1,
      width,
      height,
      color: rgb(0.96, 0.96, 0.96),
      borderRadius,
    });
    // Draw actual card
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: bgColor,
      borderColor,
      borderWidth: 1,
      borderRadius,
    });
  };

  // Helper: Draw a beautiful header on every page
  const drawPageHeader = (page: any, pageNum: number) => {
    // Top visual line accent
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 6,
      width: PAGE_WIDTH,
      height: 6,
      color: PRIMARY_GREEN,
    });

    // Logo & Title
    if (logoImg) {
      page.drawImage(logoImg, {
        x: MARGIN,
        y: PAGE_HEIGHT - 38,
        width: 18,
        height: 18,
      });
    }

    page.drawText("FARM SHIELD", {
      x: logoImg ? MARGIN + 24 : MARGIN,
      y: PAGE_HEIGHT - 34,
      size: 13,
      font: fontBold,
      color: PRIMARY_GREEN,
    });

    page.drawText("AI Plant Diagnosis Report", {
      x: logoImg ? MARGIN + 120 : MARGIN + 100,
      y: PAGE_HEIGHT - 34,
      size: 10,
      font: fontBold,
      color: TEXT_PRIMARY,
    });

    // Page number
    page.drawText(`Page ${pageNum} of 3`, {
      x: PAGE_WIDTH - MARGIN - 65,
      y: PAGE_HEIGHT - 34,
      size: 9.5,
      font: fontBold,
      color: TEXT_PRIMARY,
    });

    // Double-lined divider with green & amber accents
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 44 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 44 },
      color: PRIMARY_GREEN,
      thickness: 1.5,
    });
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 47 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 47 },
      color: AMBER_ACCENT,
      thickness: 1,
    });
  };

  // Helper: Draw clean footer on every page
  const drawPageFooter = (page: any) => {
    page.drawLine({
      start: { x: MARGIN, y: 45 },
      end: { x: PAGE_WIDTH - MARGIN, y: 45 },
      color: BORDER_MUTED,
      thickness: 1,
    });

    page.drawText("Generated by Farm Shield AI • High-Fidelity Agriculture Diagnosis", {
      x: MARGIN,
      y: 30,
      size: 8,
      font: fontRegular,
      color: TEXT_SECONDARY,
    });

    const timestamp = new Date(record.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    page.drawText(timestamp, {
      x: PAGE_WIDTH - MARGIN - 120,
      y: 30,
      size: 8,
      font: fontRegular,
      color: TEXT_SECONDARY,
    });
  };

  // Helper: Draw severity color coded label
  const getSeverityColors = (sev: string) => {
    const s = sev?.toLowerCase();
    if (s === "high" || s === "critical") {
      return { bg: SOFT_RED, border: DANGER_RED, text: DANGER_RED };
    } else if (s === "medium") {
      return { bg: SOFT_AMBER, border: AMBER_ACCENT, text: AMBER_ACCENT };
    } else {
      return { bg: SOFT_GREEN, border: PRIMARY_GREEN, text: PRIMARY_GREEN };
    }
  };

  // ===========================================================================
  // ── PAGE 1: HERO & SUMMARY ────────────────────────────────────────────────
  // ===========================================================================
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(page1, 1);
  drawPageFooter(page1);

  let y = PAGE_HEIGHT - 70;

  // Title section
  page1.drawText("Agricultural Plant Diagnosis", {
    x: MARGIN,
    y,
    size: 26,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  y -= 15;

  page1.drawText(`Report ID: #${record.id.slice(0, 8).toUpperCase()} • Date: ${new Date(record.timestamp).toLocaleDateString()}`, {
    x: MARGIN,
    y,
    size: 10,
    font: fontRegular,
    color: TEXT_SECONDARY,
  });
  y -= 30;

  // 1. Plant Image and Species identification hero
  const heroCardHeight = 180;
  drawCard(page1, { x: MARGIN, y: y - heroCardHeight, width: CONTENT_WIDTH, height: heroCardHeight });

  // Draw Plant Image inside card
  const imgBoxWidth = 200;
  const imgBoxHeight = 150;
  const imgX = MARGIN + 15;
  const imgY = y - heroCardHeight + 15;

  if (plantImg) {
    page1.drawImage(plantImg, {
      x: imgX,
      y: imgY,
      width: imgBoxWidth,
      height: imgBoxHeight,
    });
  } else {
    // Beautiful placeholder vector graphic if image fetch failed
    page1.drawRectangle({
      x: imgX,
      y: imgY,
      width: imgBoxWidth,
      height: imgBoxHeight,
      color: SOFT_GREEN,
      borderRadius: 8,
    });
    page1.drawText("Image Stored Securely in Cloud", {
      x: imgX + 25,
      y: imgY + 70,
      size: 10,
      font: fontRegular,
      color: PRIMARY_GREEN,
    });
  }

  // Draw Hero Details (right of image)
  const detailX = imgX + imgBoxWidth + 20;
  let detailY = y - 25;

  page1.drawText(diagnosis.plantIdentification.commonName, {
    x: detailX,
    y: detailY,
    size: 20,
    font: fontBold,
    color: PRIMARY_GREEN,
  });
  detailY -= 15;

  page1.drawText(diagnosis.plantIdentification.scientificName, {
    x: detailX,
    y: detailY,
    size: 11,
    font: fontRegular,
    color: TEXT_SECONDARY,
  });
  detailY -= 25;

  // Disease status
  page1.drawText("DIAGNOSED CONDITION", {
    x: detailX,
    y: detailY,
    size: 8,
    font: fontBold,
    color: TEXT_SECONDARY,
  });
  detailY -= 15;

  page1.drawText(diagnosis.diseaseDetection.diseaseName, {
    x: detailX,
    y: detailY,
    size: 14,
    font: fontBold,
    color: diagnosis.diseaseDetection.isHealthy ? PRIMARY_GREEN : DANGER_RED,
  });
  detailY -= 25;

  // Severity Badge
  const sevColors = getSeverityColors(diagnosis.diseaseDetection.severity);
  const badgeWidth = 90;
  const badgeHeight = 22;
  page1.drawRectangle({
    x: detailX,
    y: detailY - 5,
    width: badgeWidth,
    height: badgeHeight,
    color: sevColors.bg,
    borderColor: sevColors.border,
    borderWidth: 1,
    borderRadius: 6,
  });

  page1.drawText(`Severity: ${diagnosis.diseaseDetection.severity.toUpperCase()}`, {
    x: detailX + 8,
    y: detailY,
    size: 9,
    font: fontBold,
    color: sevColors.text,
  });

  y -= (heroCardHeight + 25);

  // 2. Summary details row (4 Columns)
  const colGap = 15;
  const colWidth = (CONTENT_WIDTH - (colGap * 3)) / 4;
  const summaryCardHeight = 70;

  const metrics = [
    { label: "Confidence", val: `${diagnosis.confidenceScore.overallConfidence}%`, col: INFO_BLUE, soft: SOFT_BLUE },
    { label: "Urgency", val: diagnosis.treatmentPlan.urgencyLevel.toUpperCase(), col: sevColors.text, soft: sevColors.bg },
    { label: "Family", val: diagnosis.plantIdentification.family, col: PRIMARY_GREEN, soft: SOFT_GREEN },
    { label: "Affected Parts", val: diagnosis.diseaseDetection.affectedParts.slice(0, 2).join(", "), col: TEXT_PRIMARY, soft: BG_OFF_WHITE }
  ];

  metrics.forEach((m, idx) => {
    const cx = MARGIN + idx * (colWidth + colGap);
    drawCard(page1, { x: cx, y: y - summaryCardHeight, width: colWidth, height: summaryCardHeight, bgColor: m.soft });

    page1.drawText(m.label.toUpperCase(), {
      x: cx + 12,
      y: y - 20,
      size: 8,
      font: fontBold,
      color: TEXT_SECONDARY,
    });

    const lines = wrapText(m.val, colWidth - 24, 11, fontBold);
    lines.slice(0, 2).forEach((line, lIdx) => {
      page1.drawText(line, {
        x: cx + 12,
        y: y - 40 - (lIdx * 14),
        size: 11,
        font: fontBold,
        color: m.col,
      });
    });
  });

  y -= (summaryCardHeight + 25);

  // 3. Plant description & fun fact
  const descCardHeight = 120;
  drawCard(page1, { x: MARGIN, y: y - descCardHeight, width: CONTENT_WIDTH, height: descCardHeight });

  page1.drawText("PLANT SPECIES OVERVIEW", {
    x: MARGIN + 18,
    y: y - 22,
    size: 9,
    font: fontBold,
    color: PRIMARY_GREEN,
  });

  const descLines = wrapText(diagnosis.plantIdentification.description, CONTENT_WIDTH - 36, 10, fontRegular);
  descLines.slice(0, 3).forEach((line, lIdx) => {
    page1.drawText(line, {
      x: MARGIN + 18,
      y: y - 42 - (lIdx * 14),
      size: 10,
      font: fontRegular,
      color: TEXT_PRIMARY,
    });
  });

  // Fun Fact badge
  page1.drawRectangle({
    x: MARGIN + 18,
    y: y - descCardHeight + 15,
    width: CONTENT_WIDTH - 36,
    height: 25,
    color: SOFT_GREEN,
    borderRadius: 6,
  });

  page1.drawText(`Did You Know? ${diagnosis.plantIdentification.funFact}`, {
    x: MARGIN + 26,
    y: y - descCardHeight + 25,
    size: 9,
    font: fontRegular,
    color: PRIMARY_GREEN,
  });


  // ===========================================================================
  // ── PAGE 2: TREATMENT & RECOVERY ──────────────────────────────────────────
  // ===========================================================================
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(page2, 2);
  drawPageFooter(page2);

  let y2 = PAGE_HEIGHT - 70;

  page2.drawText("Actionable Treatment Plan", {
    x: MARGIN,
    y: y2,
    size: 20,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  y2 -= 25;

  // Immediate, Short, and Long Term actions
  const actionCardHeight = 150;
  drawCard(page2, { x: MARGIN, y: y2 - actionCardHeight, width: CONTENT_WIDTH, height: actionCardHeight });

  page2.drawText("IMMEDIATE & SEASONAL INTERVENTIONS", {
    x: MARGIN + 18,
    y: y2 - 22,
    size: 9,
    font: fontBold,
    color: PRIMARY_GREEN,
  });

  // Render horizontal action cards or side-by-side layout
  const actionColW = (CONTENT_WIDTH - 36 - 20) / 3;
  const actionTypes = [
    { title: "Immediate", steps: diagnosis.treatmentPlan.immediateActions, color: DANGER_RED },
    { title: "Short-Term", steps: diagnosis.treatmentPlan.shortTermActions, color: AMBER_ACCENT },
    { title: "Long-Term", steps: diagnosis.treatmentPlan.longTermActions, color: PRIMARY_GREEN },
  ];

  actionTypes.forEach((act, actIdx) => {
    const ax = MARGIN + 18 + actIdx * (actionColW + 10);
    const ay = y2 - 35;

    // Header column line
    page2.drawLine({
      start: { x: ax, y: ay },
      end: { x: ax + actionColW, y: ay },
      color: act.color,
      thickness: 2,
    });

    page2.drawText(act.title, {
      x: ax,
      y: ay - 14,
      size: 11,
      font: fontBold,
      color: act.color,
    });

    let stepY = ay - 30;
    act.steps.slice(0, 3).forEach((step, sIdx) => {
      // Bullet title
      page2.drawText(`• ${step.label}`, {
        x: ax,
        y: stepY,
        size: 9,
        font: fontBold,
        color: TEXT_PRIMARY,
      });
      stepY -= 11;

      const detailLines = wrapText(step.detail, actionColW, 8, fontRegular);
      detailLines.slice(0, 2).forEach(line => {
        page2.drawText(line, {
          x: ax + 6,
          y: stepY,
          size: 8,
          font: fontRegular,
          color: TEXT_SECONDARY,
        });
        stepY -= 10;
      });
      stepY -= 3;
    });
  });

  y2 -= (actionCardHeight + 25);

  // Fertilizer recommendations
  page2.drawText("Fertilizer & Soil Nutrition", {
    x: MARGIN,
    y: y2,
    size: 20,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  y2 -= 25;

  const fertCardHeight = 150;
  drawCard(page2, { x: MARGIN, y: y2 - fertCardHeight, width: CONTENT_WIDTH, height: fertCardHeight });

  page2.drawText("RECOMMENDED SOIL NUTRIENTS", {
    x: MARGIN + 18,
    y: y2 - 22,
    size: 9,
    font: fontBold,
    color: PRIMARY_GREEN,
  });

  // Loop recommended fertilizers
  let fertX = MARGIN + 18;
  const ferts = diagnosis.fertilizerRecommendations.slice(0, 2);
  const fertWidth = (CONTENT_WIDTH - 36 - 15) / 2;

  ferts.forEach((fert, idx) => {
    const fx = fertX + idx * (fertWidth + 15);
    const fy = y2 - 32;

    // Draw secondary inner card for each fertilizer
    page2.drawRectangle({
      x: fx,
      y: fy - 102,
      width: fertWidth,
      height: 102,
      color: BG_OFF_WHITE,
      borderColor: BORDER_MUTED,
      borderWidth: 1,
      borderRadius: 8,
    });

    page2.drawText(fert.name, {
      x: fx + 12,
      y: fy - 18,
      size: 11,
      font: fontBold,
      color: PRIMARY_GREEN,
    });

    // Badge type
    const isOrganic = fert.type === "organic";
    page2.drawRectangle({
      x: fx + fertWidth - 65,
      y: fy - 20,
      width: 55,
      height: 14,
      color: isOrganic ? SOFT_GREEN : SOFT_BLUE,
      borderRadius: 4,
    });
    page2.drawText(fert.type.toUpperCase(), {
      x: fx + fertWidth - 60,
      y: fy - 14,
      size: 7,
      font: fontBold,
      color: isOrganic ? PRIMARY_GREEN : INFO_BLUE,
    });

    page2.drawText(`NPK: ${fert.npk || "Balanced"}`, {
      x: fx + 12,
      y: fy - 34,
      size: 9,
      font: fontRegular,
      color: TEXT_SECONDARY,
    });

    page2.drawText(`Dosage: ${fert.dosage}`, {
      x: fx + 12,
      y: fy - 48,
      size: 9,
      font: fontRegular,
      color: TEXT_PRIMARY,
    });

    page2.drawText(`Time: ${fert.applicationTime}`, {
      x: fx + 12,
      y: fy - 62,
      size: 8,
      font: fontRegular,
      color: TEXT_SECONDARY,
    });

    const benefitLines = wrapText(`Benefit: ${fert.benefit}`, fertWidth - 24, 8, fontRegular);
    benefitLines.slice(0, 2).forEach((line, bIdx) => {
      page2.drawText(line, {
        x: fx + 12,
        y: fy - 76 - (bIdx * 10),
        size: 8,
        font: fontRegular,
        color: TEXT_SECONDARY,
      });
    });
  });

  y2 -= (fertCardHeight + 25);

  // Weather & Soil Insights
  page2.drawText("Weather & Environmental Soil Insights", {
    x: MARGIN,
    y: y2,
    size: 16,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  y2 -= 20;

  const weatherCardH = 110;
  drawCard(page2, { x: MARGIN, y: y2 - weatherCardH, width: CONTENT_WIDTH, height: weatherCardH });

  page2.drawText("ENVIRONMENTAL IMPACT REPORT", {
    x: MARGIN + 18,
    y: y2 - 20,
    size: 9,
    font: fontBold,
    color: PRIMARY_GREEN,
  });

  let wxY = y2 - 40;
  const preventText = diagnosis.preventionRecovery.seasonalAdvice;
  const preventLines = wrapText(`Seasonal Advice: ${preventText}`, CONTENT_WIDTH - 36, 9, fontRegular);
  preventLines.slice(0, 3).forEach((line, idx) => {
    page2.drawText(line, {
      x: MARGIN + 18,
      y: wxY - (idx * 13),
      size: 9,
      font: fontRegular,
      color: TEXT_PRIMARY,
    });
  });

  page2.drawText(`Monitoring Protocol: ${diagnosis.preventionRecovery.monitoring}`, {
    x: MARGIN + 18,
    y: y2 - weatherCardH + 15,
    size: 9,
    font: fontBold,
    color: AMBER_ACCENT,
  });


  // ===========================================================================
  // ── PAGE 3: DEEP EXPERT ANALYSIS & METADATA ───────────────────────────────
  // ===========================================================================
  const page3 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(page3, 3);
  drawPageFooter(page3);

  let y3 = PAGE_HEIGHT - 70;

  page3.drawText("Deep Artificial Intelligence Diagnosis", {
    x: MARGIN,
    y: y3,
    size: 20,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  y3 -= 25;

  // Explanatory detail block
  const explainH = 190;
  drawCard(page3, { x: MARGIN, y: y3 - explainH, width: CONTENT_WIDTH, height: explainH });

  page3.drawText("EXPERT PATHOLOGY REPORT SUMMARY", {
    x: MARGIN + 18,
    y: y3 - 22,
    size: 9,
    font: fontBold,
    color: PRIMARY_GREEN,
  });

  let expY = y3 - 42;
  const docSummary = diagnosis.diseaseDetection.description;
  const summaryLines = wrapText(docSummary, CONTENT_WIDTH - 36, 10, fontRegular);
  summaryLines.slice(0, 4).forEach((line, idx) => {
    page3.drawText(line, {
      x: MARGIN + 18,
      y: expY - (idx * 14),
      size: 10,
      font: fontRegular,
      color: TEXT_PRIMARY,
    });
  });

  expY -= 65;

  page3.drawText("PRIMARY PATHOGEN/CAUSE FACTORS", {
    x: MARGIN + 18,
    y: expY,
    size: 9,
    font: fontBold,
    color: TEXT_SECONDARY,
  });
  expY -= 15;

  const causeLines = wrapText(`Cause & Vectors: ${diagnosis.diseaseDetection.cause}`, CONTENT_WIDTH - 36, 9.5, fontRegular);
  causeLines.slice(0, 2).forEach((line, idx) => {
    page3.drawText(line, {
      x: MARGIN + 18,
      y: expY - (idx * 13),
      size: 9.5,
      font: fontRegular,
      color: TEXT_PRIMARY,
    });
  });

  expY -= 35;

  // Symptoms chips list
  const symptomList = diagnosis.diseaseDetection.symptoms.slice(0, 4).join("  •  ");
  page3.drawText(`Symptoms Identified:  ${symptomList}`, {
    x: MARGIN + 18,
    y: expY,
    size: 9,
    font: fontBold,
    color: DANGER_RED,
  });

  y3 -= (explainH + 25);

  // Recovery Timeline Timeline
  page3.drawText("Structured Recovery Timeline", {
    x: MARGIN,
    y: y3,
    size: 18,
    font: fontBold,
    color: TEXT_PRIMARY,
  });
  y3 -= 25;

  const timelineH = 170;
  drawCard(page3, { x: MARGIN, y: y3 - timelineH, width: CONTENT_WIDTH, height: timelineH });

  page3.drawText("PATHOLOGICAL PROGRESSION & RECOVERY TIMELINE", {
    x: MARGIN + 18,
    y: y3 - 22,
    size: 9,
    font: fontBold,
    color: PRIMARY_GREEN,
  });

  const stages = [
    { day: "7 Days", title: "Infection Arrest", details: "Apply immediate treatments. Pathogen spread stops. Pruning of heavily affected areas completed." },
    { day: "14 Days", title: "Tissue Regeneration", details: "Nutrient levels stabilized via fertilizer application. Fresh green shoots emerge on affected foliage." },
    { day: "30 Days", title: "Systemic Immunity", details: "Foliar recovery completed. Long-term biosecurity measures active. Return to standard yields." },
  ];

  stages.forEach((stage, idx) => {
    const sy = y3 - 52 - (idx * 38);

    // Left bullet marker
    page3.drawCircle({
      x: MARGIN + 28,
      y: sy + 4,
      radius: 6,
      color: PRIMARY_GREEN,
    });

    if (idx < 2) {
      // Connective line
      page3.drawLine({
        start: { x: MARGIN + 28, y: sy - 2 },
        end: { x: MARGIN + 28, y: sy - 30 },
        color: PRIMARY_GREEN,
        thickness: 1.5,
      });
    }

    page3.drawText(stage.day, {
      x: MARGIN + 45,
      y: sy + 1,
      size: 11,
      font: fontBold,
      color: PRIMARY_GREEN,
    });

    page3.drawText(stage.title, {
      x: MARGIN + 105,
      y: sy + 1,
      size: 11,
      font: fontBold,
      color: TEXT_PRIMARY,
    });

    const lines = wrapText(stage.details, CONTENT_WIDTH - 145, 9, fontRegular);
    lines.slice(0, 2).forEach((line, lIdx) => {
      page3.drawText(line, {
        x: MARGIN + 105,
        y: sy - 12 - (lIdx * 10),
        size: 9,
        font: fontRegular,
        color: TEXT_SECONDARY,
      });
    });
  });

  // 5. Save the generated PDF bytes and download to the browser
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Trigger browser download
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date(record.timestamp).toISOString().split("T")[0];
  const safeName = (record.plantName || "Plant").replace(/[^a-zA-Z0-9]/g, "_");
  link.download = `FarmShield_Diagnosis_Report_${safeName}_${dateStr}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
