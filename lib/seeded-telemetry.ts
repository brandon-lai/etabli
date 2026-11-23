// Deterministic Mulberry32 PRNG generating 64 realistic Unitas 6497-1 bench
// calibration runs across all 11 lessons and 6 positions for zero-DB operation
// and local Postgres seeding.

import { COURSE_1_LESSONS } from "./horology/course1"
import type { WatchPosition } from "./horology/physics"

export interface TelemetryRunRow {
  id: number
  lessonId: string
  phaseMode: "show" | "guide" | "solo" | "debrief" | "explore"
  positionCode: WatchPosition
  amplitudeDeg: number
  rateSecPerDay: number
  beatErrorMs: number
  slipsCount: number
  soloPassed: boolean
  createdAtIso: string
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const POSITIONS: readonly WatchPosition[] = ["DU", "DD", "CU", "CD", "CL", "CR"]

export function generateSeededTelemetryRuns(count = 64): TelemetryRunRow[] {
  const rand = mulberry32(649718000)
  const baseEpoch = Date.UTC(2026, 10, 1, 9, 0, 0)
  const rows: TelemetryRunRow[] = []

  for (let i = 0; i < count; i++) {
    const lesson = COURSE_1_LESSONS[i % COURSE_1_LESSONS.length]
    const pos = POSITIONS[i % POSITIONS.length]
    const isFlat = pos === "DU" || pos === "DD"
    const soloPassed = rand() > 0.16
    const baseAmp = soloPassed
      ? (isFlat ? 286 : 266) + (rand() - 0.35) * 24
      : 214 + rand() * 38
    const rate = soloPassed
      ? (rand() - 0.48) * 6.4
      : (rand() > 0.5 ? 1 : -1) * (14 + rand() * 48)
    const beatErr = soloPassed ? 0.08 + rand() * 0.34 : 0.65 + rand() * 1.4
    const slips = soloPassed ? (rand() > 0.78 ? 1 : 0) : 1 + Math.floor(rand() * 3)

    rows.push({
      id: i + 1,
      lessonId: lesson.id,
      phaseMode: soloPassed ? "solo" : "guide",
      positionCode: pos,
      amplitudeDeg: Number(baseAmp.toFixed(1)),
      rateSecPerDay: Number(rate.toFixed(1)),
      beatErrorMs: Number(beatErr.toFixed(2)),
      slipsCount: slips,
      soloPassed,
      createdAtIso: new Date(baseEpoch + i * 5400 * 1000).toISOString(),
    })
  }

  return rows.reverse()
}
