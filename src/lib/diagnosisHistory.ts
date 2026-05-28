/**
 * Firestore + LocalStorage Diagnosis History Service
 * Collection: plant_diagnosis_history
 * Stores all diagnosis records per user with robust offline LocalStorage backup.
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { SanitizedDiagnosis } from "./groqDiagnosis";

const COLLECTION = "plant_diagnosis_history";

// ─── Document shape stored in Firestore / LocalStorage ─────────────────────────
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
  let docId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let savedToFirestore = false;

  const docPayload = {
    userId,
    imageUrl,
    plantName: diagnosis.plantIdentification.commonName || diagnosis.plantName || "Unknown Plant",
    scientificName: diagnosis.plantIdentification.scientificName || "",
    diseaseName: diagnosis.diseaseDetection.diseaseName || "Healthy",
    isHealthy: diagnosis.diseaseDetection.isHealthy ?? true,
    severity: diagnosis.diseaseDetection.severity || "none",
    overallConfidence: diagnosis.confidenceScore.overallConfidence || 100,
    groqSummary: diagnosis.groqSummary || "",
    groqResponse: diagnosis,
    treatmentSummary: diagnosis.treatmentPlan.summary || "",
    fertilizerCount: diagnosis.fertilizerRecommendations?.length || 0,
    timestamp: diagnosis.diagnosisDate || new Date().toISOString(),
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION), docPayload);
    docId = docRef.id;
    savedToFirestore = true;
  } catch (err) {
    console.error("Firestore save failed, falling back to LocalStorage:", err);
  }

  // Backup or store primarily in LocalStorage (scoped by userId)
  try {
    const storageKey = `farmshield_history_${userId}`;
    const localRecord: DiagnosisHistoryRecord = {
      id: docId,
      userId,
      imageUrl,
      plantName: docPayload.plantName,
      scientificName: docPayload.scientificName,
      diseaseName: docPayload.diseaseName,
      isHealthy: docPayload.isHealthy,
      severity: docPayload.severity,
      overallConfidence: docPayload.overallConfidence,
      groqSummary: docPayload.groqSummary,
      groqResponse: docPayload.groqResponse,
      treatmentSummary: docPayload.treatmentSummary,
      fertilizerCount: docPayload.fertilizerCount,
      timestamp: docPayload.timestamp,
      createdAt: null,
    };

    const existing = localStorage.getItem(storageKey);
    const list = existing ? JSON.parse(existing) : [];
    // Prevent duplicate entries
    if (!list.some((r: any) => r.id === docId)) {
      list.unshift(localRecord);
    }
    localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error("LocalStorage save failed:", e);
  }

  return docId;
}

// ─── Fetch all diagnoses for a user ──────────────────────────────────────────
export async function fetchDiagnosisHistory(
  userId: string
): Promise<DiagnosisHistoryRecord[]> {
  let records: DiagnosisHistoryRecord[] = [];

  // 1. Try to fetch from Firestore
  try {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    records = snapshot.docs.map((d) => {
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
  } catch (err) {
    console.error("Firestore fetch failed, relying on LocalStorage:", err);
  }

  // 2. Merge with LocalStorage data (prevents loss if offline/un-synchronized records exist)
  try {
    const storageKey = `farmshield_history_${userId}`;
    const localData = localStorage.getItem(storageKey);
    if (localData) {
      const localRecords: DiagnosisHistoryRecord[] = JSON.parse(localData);
      localRecords.forEach((localRec) => {
        if (!records.some((r) => r.id === localRec.id)) {
          records.push(localRec);
        }
      });
    }
  } catch (e) {
    console.error("LocalStorage read failed:", e);
  }

  // Sort by timestamp descending in memory
  records.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  return records;
}

// ─── Delete a diagnosis record ────────────────────────────────────────────────
export async function deleteDiagnosisRecord(recordId: string, userId?: string): Promise<void> {
  // 1. Try to delete from Firestore
  try {
    await deleteDoc(doc(db, COLLECTION, recordId));
  } catch (err) {
    console.error("Firestore delete failed:", err);
  }

  // 2. Delete from LocalStorage if user ID is specified
  if (userId) {
    try {
      const storageKey = `farmshield_history_${userId}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        let localRecords: DiagnosisHistoryRecord[] = JSON.parse(localData);
        localRecords = localRecords.filter((r) => r.id !== recordId);
        localStorage.setItem(storageKey, JSON.stringify(localRecords));
      }
    } catch (e) {
      console.error("LocalStorage delete failed:", e);
    }
  }
}

// ─── Fetch a single diagnosis by record ID ─────────────────────────────────────
import { getDoc } from "firebase/firestore";

export async function fetchDiagnosisById(
  recordId: string,
  userId?: string
): Promise<DiagnosisHistoryRecord | null> {
  // 1. Try Firestore
  try {
    const docRef = doc(db, COLLECTION, recordId);
    const d = await getDoc(docRef);
    if (d.exists()) {
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
  } catch (err) {
    console.error("Firestore getDoc failed:", err);
  }

  // 2. Try LocalStorage fallback
  if (userId) {
    try {
      const storageKey = `farmshield_history_${userId}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const localRecords: DiagnosisHistoryRecord[] = JSON.parse(localData);
        const found = localRecords.find((r) => r.id === recordId);
        if (found) return found;
      }
    } catch (e) {
      console.error("LocalStorage get by ID failed:", e);
    }
  }

  return null;
}
