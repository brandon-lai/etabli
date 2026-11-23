import { NextResponse } from "next/server"
import { COURSE_1_LESSONS } from "@/lib/horology/course1"
import { getSql, hasDatabase, verifyBearerOrHeaderSecret } from "@/lib/db"
import { generateSeededTelemetryRuns } from "@/lib/seeded-telemetry"

export async function POST(request: Request) {
  const provided =
    request.headers.get("x-admin-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!verifyBearerOrHeaderSecret(provided, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { configured: false, error: "DATABASE_URL is not configured" },
      { status: 503 }
    )
  }

  const sql = getSql()

  for (const lesson of COURSE_1_LESSONS) {
    await sql`
      INSERT INTO advisor_lesson_reviews (lesson_id, advisor_handle, approved_stipend_cents, signed_off_events_count)
      VALUES (${lesson.id}, ${"henri-delacroix-wostep"}, 0, 0)
      ON CONFLICT (lesson_id) DO NOTHING
    `
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM bench_telemetry_runs`
  let seededRuns = 0
  if (Number(count) === 0) {
    const sample = generateSeededTelemetryRuns(64)
    for (const r of sample) {
      await sql`
        INSERT INTO bench_telemetry_runs (
          lesson_id,
          phase_mode,
          position_code,
          amplitude_tenths_deg,
          rate_tenths_sec_day,
          beat_error_tenths_ms,
          slips_count,
          solo_passed,
          client_fingerprint_hash,
          created_at
        ) VALUES (
          ${r.lessonId},
          ${r.phaseMode},
          ${r.positionCode},
          ${Math.round(r.amplitudeDeg * 10)},
          ${Math.round(r.rateSecPerDay * 10)},
          ${Math.round(r.beatErrorMs * 10)},
          ${r.slipsCount},
          ${r.soloPassed},
          ${"seeded-cohort-calibration"},
          ${r.createdAtIso}
        )
      `
      seededRuns += 1
    }
  }

  return NextResponse.json({
    ok: true,
    lessonsPrepared: COURSE_1_LESSONS.length,
    seededRuns,
  })
}
