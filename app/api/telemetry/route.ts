import { NextResponse } from "next/server"
import { getSql, hasDatabase, hashClientFingerprint } from "@/lib/db"
import { generateSeededTelemetryRuns } from "@/lib/seeded-telemetry"

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({
      configured: false,
      mode: "deterministic_seed",
      runs: generateSeededTelemetryRuns(64),
    })
  }

  const sql = getSql()
  const rows = await sql`
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

  return NextResponse.json({
    configured: true,
    mode: "postgres",
    runs: rows.map((r) => ({
      id: Number(r.id),
      lessonId: String(r.lesson_id),
      phaseMode: String(r.phase_mode),
      positionCode: String(r.position_code),
      amplitudeDeg: Number(r.amplitude_tenths_deg) / 10,
      rateSecPerDay: Number(r.rate_tenths_sec_day) / 10,
      beatErrorMs: Number(r.beat_error_tenths_ms) / 10,
      slipsCount: Number(r.slips_count),
      soloPassed: Boolean(r.solo_passed),
      createdAtIso: new Date(r.created_at as string | Date).toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "DATABASE_URL is not configured on this deployment. Your bench progress is saved locally in IndexedDB.",
      },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const lessonId = String(body.lessonId || "").trim()
  const phaseMode = String(body.phaseMode || "solo")
  const positionCode = String(body.positionCode || "DU")
  if (!lessonId || lessonId.length > 40) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 })
  }
  if (!["show", "guide", "solo", "debrief", "explore"].includes(phaseMode)) {
    return NextResponse.json({ error: "Invalid phaseMode" }, { status: 400 })
  }
  if (!["DU", "DD", "CU", "CD", "CL", "CR"].includes(positionCode)) {
    return NextResponse.json({ error: "Invalid positionCode" }, { status: 400 })
  }

  const ampTenths = Math.max(
    0,
    Math.min(3600, Math.round(Number(body.amplitudeDeg || 0) * 10))
  )
  const rateTenths = Math.max(
    -9999,
    Math.min(9999, Math.round(Number(body.rateSecPerDay || 0) * 10))
  )
  const beatTenths = Math.max(
    0,
    Math.min(999, Math.round(Number(body.beatErrorMs || 0) * 10))
  )
  const slipsCount = Math.max(0, Math.round(Number(body.slipsCount || 0)))
  const soloPassed = Boolean(body.soloPassed)
  const fp = hashClientFingerprint(request.headers)

  const sql = getSql()
  const [inserted] = await sql`
    INSERT INTO bench_telemetry_runs (
      lesson_id,
      phase_mode,
      position_code,
      amplitude_tenths_deg,
      rate_tenths_sec_day,
      beat_error_tenths_ms,
      slips_count,
      solo_passed,
      client_fingerprint_hash
    ) VALUES (
      ${lessonId},
      ${phaseMode},
      ${positionCode},
      ${ampTenths},
      ${rateTenths},
      ${beatTenths},
      ${slipsCount},
      ${soloPassed},
      ${fp}
    )
    RETURNING id, created_at
  `

  return NextResponse.json(
    {
      configured: true,
      id: Number(inserted.id),
      createdAtIso: new Date(inserted.created_at as string | Date).toISOString(),
    },
    { status: 201 }
  )
}
