// Zero-friction local IndexedDB persistence for Établi bench progress,
// lesson phase state, action replay logs, and pre/post quiz scores.

import type { LessonPhaseMode } from "./horology/course1"

export interface ReplayActionEntry {
  timestampSec: number
  stepTitle: string
  partId?: string
  toolId?: string
  outcome: "clean" | "slip" | "warning"
  note: string
}

export interface LessonCompletionRecord {
  lessonId: string
  completedPhases: LessonPhaseMode[]
  soloPassed: boolean
  bestRateSecPerDay: number
  bestAmplitudeDeg: number
  bestBeatErrorMs: number
  slipsCount: number
  completedAtIso: string
  replayLog: ReplayActionEntry[]
}

export interface BenchDossierState {
  version: 1
  activeLessonId: string
  activePhase: LessonPhaseMode
  completedLessons: Record<string, LessonCompletionRecord>
  preQuizScore: number | null
  postQuizScore: number | null
  updatedAtIso: string
}

const DB_NAME = "etabli_bench_db"
const DB_VERSION = 1
const STORE_NAME = "dossier"
const RECORD_KEY = "primary"

export const DEFAULT_DOSSIER_STATE: BenchDossierState = {
  version: 1,
  activeLessonId: "c1-l01",
  activePhase: "show",
  completedLessons: {},
  preQuizScore: null,
  postQuizScore: null,
  updatedAtIso: new Date(0).toISOString(),
}

function openBenchDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function loadBenchDossier(): Promise<BenchDossierState> {
  const db = await openBenchDb()
  if (!db) return DEFAULT_DOSSIER_STATE
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const getReq = store.get(RECORD_KEY)
      getReq.onsuccess = () => {
        const val = getReq.result as BenchDossierState | undefined
        resolve(val && val.version === 1 ? val : DEFAULT_DOSSIER_STATE)
      }
      getReq.onerror = () => resolve(DEFAULT_DOSSIER_STATE)
    } catch {
      resolve(DEFAULT_DOSSIER_STATE)
    }
  })
}

export async function saveBenchDossier(next: BenchDossierState): Promise<void> {
  const db = await openBenchDb()
  if (!db) return
  const stamped: BenchDossierState = {
    ...next,
    updatedAtIso: new Date().toISOString(),
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(stamped, RECORD_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}
