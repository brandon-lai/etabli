import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { getSql, hasDatabase } from "@/lib/db"

function verifySignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string | undefined
): boolean {
  if (!sigHeader || !secret) return false
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const idx = kv.indexOf("=")
      return idx > 0 ? [kv.slice(0, idx).trim(), kv.slice(idx + 1).trim()] : ["", ""]
    })
  )
  const timestamp = parts.t
  const v1 = parts.v1
  if (!timestamp || !v1 || !/^\d+$/.test(timestamp)) return false

  const expectedHex = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")

  const a = Buffer.from(v1, "utf8")
  const b = Buffer.from(expectedHex, "utf8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const sigHeader = request.headers.get("x-etabli-signature")

  if (!verifySignature(rawBody, sigHeader, process.env.WEBHOOK_SIGNING_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { configured: false, error: "DATABASE_URL is not configured" },
      { status: 503 }
    )
  }

  let event: {
    event_id?: string
    session_id?: string
    lesson_id?: string
    advisor_handle?: string
    provider_stipend_cents?: number
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 })
  }

  const eventId = String(event.event_id || "").trim()
  const sessionId = String(event.session_id || eventId).trim()
  const lessonId = String(event.lesson_id || "").trim()
  const advisorHandle = String(event.advisor_handle || "wostep-reviewer").trim()
  const providerStipendCents = Number(event.provider_stipend_cents)

  if (
    eventId.length < 4 ||
    sessionId.length < 4 ||
    lessonId.length < 3 ||
    !Number.isInteger(providerStipendCents) ||
    providerStipendCents < 0
  ) {
    return NextResponse.json({ error: "Invalid event fields" }, { status: 400 })
  }

  const payloadSha = createHash("sha256").update(rawBody).digest("hex")
  const sql = getSql()

  const outcome = await sql.begin(async (tx) => {
    await tx`
      INSERT INTO advisor_lesson_reviews (lesson_id, advisor_handle, approved_stipend_cents, signed_off_events_count)
      VALUES (${lessonId}, ${advisorHandle}, 0, 0)
      ON CONFLICT (lesson_id) DO NOTHING
    `

    const claimed = await tx`
      INSERT INTO advisor_webhook_events (event_id, session_id, lesson_id, stipend_delta_cents, payload_sha256)
      VALUES (${eventId}, ${sessionId}, ${lessonId}, ${providerStipendCents}, ${payloadSha})
      ON CONFLICT DO NOTHING
      RETURNING event_id
    `

    if (claimed.length === 0) {
      const [current] = await tx`
        SELECT approved_stipend_cents, signed_off_events_count
        FROM advisor_lesson_reviews
        WHERE lesson_id = ${lessonId}
      `
      return {
        replayed: true,
        approvedStipendCents: Number(current.approved_stipend_cents),
        eventsCount: Number(current.signed_off_events_count),
      }
    }

    const [updated] = await tx`
      UPDATE advisor_lesson_reviews
      SET
        advisor_handle = ${advisorHandle},
        approved_stipend_cents = approved_stipend_cents + ${providerStipendCents},
        signed_off_events_count = signed_off_events_count + 1,
        updated_at = now()
      WHERE lesson_id = ${lessonId}
      RETURNING approved_stipend_cents, signed_off_events_count
    `

    return {
      replayed: false,
      approvedStipendCents: Number(updated.approved_stipend_cents),
      eventsCount: Number(updated.signed_off_events_count),
    }
  })

  return NextResponse.json({
    ok: true,
    lessonId,
    eventId,
    ...outcome,
  })
}
