import { NextResponse } from "next/server"
import { getSql, hasDatabase, hashClientFingerprint } from "@/lib/db"

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({
      configured: false,
      mode: "deterministic_seed",
      totalQuestions: 20,
      note: "Local pre/post scores are stored in IndexedDB on this device.",
    })
  }

  const sql = getSql()
  const stats = await sql`
    SELECT
      stage,
      COUNT(*)::int AS sample_count,
      ROUND(AVG(score_points)::numeric, 2) AS avg_score
    FROM quiz_assessments
    GROUP BY stage
  `
  return NextResponse.json({
    configured: true,
    mode: "postgres",
    stats,
  })
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "DATABASE_URL is not configured. Quiz results are saved locally in IndexedDB.",
      },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const stage = String(body.stage || "")
  const scorePoints = Math.round(Number(body.scorePoints))
  if (stage !== "pre" && stage !== "post") {
    return NextResponse.json({ error: "stage must be pre or post" }, { status: 400 })
  }
  if (!Number.isFinite(scorePoints) || scorePoints < 0 || scorePoints > 20) {
    return NextResponse.json({ error: "scorePoints must be 0..20" }, { status: 400 })
  }

  const fp = hashClientFingerprint(request.headers)
  const sql = getSql()
  const [row] = await sql`
    INSERT INTO quiz_assessments (stage, score_points, total_questions, client_fingerprint_hash)
    VALUES (${stage}, ${scorePoints}, 20, ${fp})
    RETURNING id, created_at
  `
  return NextResponse.json(
    { configured: true, id: Number(row.id), createdAtIso: row.created_at },
    { status: 201 }
  )
}
