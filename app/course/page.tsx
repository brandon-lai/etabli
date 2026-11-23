import type { Metadata } from "next"
import { getSql, hasDatabase } from "@/lib/db"
import {
  generateSeededTelemetryRuns,
  type TelemetryRunRow,
} from "@/lib/seeded-telemetry"
import { CourseView } from "@/components/course/course-view"

export const metadata: Metadata = {
  title: "Course 1 Syllabus & Assessment",
  description:
    "11-lesson Unitas / ETA 6497-1 pocket-watch restoration syllabus, 20-question horology assessment, and live workshop timegrapher telemetry.",
}

export default async function CoursePage() {
  let rows: TelemetryRunRow[] = generateSeededTelemetryRuns(64)
  let storageMode: "postgres" | "deterministic-seed" = "deterministic-seed"

  if (hasDatabase()) {
    try {
      const sql = getSql()
      const dbRows = await sql<
        {
          id: number
          lesson_id: string
          phase_mode: "show" | "guide" | "solo" | "debrief" | "explore"
          position_code: "DU" | "DD" | "CU" | "CD" | "CL" | "CR"
          amplitude_tenths_deg: number
          rate_tenths_sec_day: number
          beat_error_tenths_ms: number
          slips_count: number
          solo_passed: boolean
          created_at: Date | string
        }[]
      >`
        SELECT
          id,
          lesson_id,
          phase_mode,
          position_code,
          amplitude_tenths_deg,
          rate_tenths_sec_day,
          beat_error_tenths_ms,
          slips_count,
          solo_passed,
          created_at
        FROM bench_telemetry_runs
        ORDER BY created_at DESC, id DESC
        LIMIT 64
      `
      if (dbRows.length > 0) {
        storageMode = "postgres"
        rows = dbRows.map((r) => ({
          id: Number(r.id),
          lessonId: r.lesson_id,
          phaseMode: r.phase_mode,
          positionCode: r.position_code,
          amplitudeDeg: Number(r.amplitude_tenths_deg) / 10,
          rateSecPerDay: Number(r.rate_tenths_sec_day) / 10,
          beatErrorMs: Number(r.beat_error_tenths_ms) / 10,
          slipsCount: Number(r.slips_count),
          soloPassed: Boolean(r.solo_passed),
          createdAtIso: new Date(r.created_at).toISOString(),
        }))
      }
    } catch {
      storageMode = "deterministic-seed"
    }
  }

  return <CourseView initialTelemetryRows={rows} storageMode={storageMode} />
}
