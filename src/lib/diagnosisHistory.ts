/**
 * Firestore Diagnosis History Service
 * Collection: plant_diagnosis_history
 * Stores all diagnosis records per user.
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { SanitizedDiagnosis } from "./groqDiagnosis";

const COLLECTION = "plant_diagnosis_history";

// ─── Document shape stored in Firestore ──────────────────────────────────────
export interface DiagnosisHistoryRecord {
  id: string;
  userId: string;
  imageUrl: string;            // Cloudinary URL
  plantName: string;           // common name
  scientificName: string;
  diseaseName: string;
  isHealthy: boolean;
  severity: string;
  overallConfidence: number;
  groqSummary: string;
  groqResponse: SanitizedDiagnosis;  // Full Groq-sanitized response
  treatmentSummary: string;
  fertilizerCount: number;
  timestamp: string;           // ISO string for display
  createdAt: Timestamp | null; // Firestore server timestamp for ordering
}

// ─── Save a new diagnosis ─────────────────────────────────────────────────────
export async function saveDiagnosisToFirestore(
  userId: string,
  imageUrl: string,
  diagnosis: SanitizedDiagnosis
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    userId,
    imageUrl,
    plantName: diagnosis.plantIdentification.commonName,
    scientificName: diagnosis.plantIdentification.scientificName,
    diseaseName: diagnosis.diseaseDetection.diseaseName,
    isHealthy: diagnosis.diseaseDetection.isHealthy,
    severity: diagnosis.diseaseDetection.severity,
    overallConfidence: diagnosis.confidenceScore.overallConfidence,
    groqSummary: diagnosis.groqSummary,
    groqResponse: diagnosis,
    treatmentSummary: diagnosis.treatmentPlan.summary,
    fertilizerCount: diagnosis.fertilizerRecommendations.length,
    timestamp: diagnosis.diagnosisDate,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

// ─── Fetch all diagnoses for a user ──────────────────────────────────────────
export async function fetchDiagnosisHistory(
  userId: string
): Promise<DiagnosisHistoryRecord[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  const records = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      imageUrl: data.imageUrl,
      plantName: data.plantName,
      scientificName: data.scientificName,
      diseaseName: data.diseaseName,
      isHealthy: data.isHealthy,
      severity: data.severity,
      overallConfidence: data.overallConfidence,
      groqSummary: data.groqSummary,
      groqResponse: data.groqResponse,
      treatmentSummary: data.treatmentSummary,
      fertilizerCount: data.fertilizerCount,
      timestamp: data.timestamp,
      createdAt: data.createdAt ?? null,
    } as DiagnosisHistoryRecord;
  });

  // Sort by timestamp descending in memory to avoid Firestore composite index requirement
  records.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  return records;
}

// ─── Delete a diagnosis record ────────────────────────────────────────────────
export async function deleteDiagnosisRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, recordId));
}

// ─── Fetch a single diagnosis by record ID ─────────────────────────────────────
import { getDoc } from "firebase/firestore";

export async function fetchDiagnosisById(
  recordId: string
): Promise<DiagnosisHistoryRecord | null> {
  const docRef = doc(db, COLLECTION, recordId);
  const d = await getDoc(docRef);
  if (!d.exists()) return null;
  
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    imageUrl: data.imageUrl,
    plantName: data.plantName,
    scientificName: data.scientificName,
    diseaseName: data.diseaseName,
    isHealthy: data.isHealthy,
    severity: data.severity,
    overallConfidence: data.overallConfidence,
    groqSummary: data.groqSummary,
    groqResponse: data.groqResponse,
    treatmentSummary: data.treatmentSummary,
    fertilizerCount: data.fertilizerCount,
    timestamp: data.timestamp,
    createdAt: data.createdAt ?? null,
  } as DiagnosisHistoryRecord;
}
