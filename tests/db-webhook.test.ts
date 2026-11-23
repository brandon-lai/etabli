import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test from "node:test"
import postgres from "postgres"

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL || "postgresql://localhost:5432/etabli"
const TEST_WEBHOOK_SECRET = "whsec_etabli_test_secret_6497"
const TEST_ADMIN_SECRET = "adm_etabli_test_secret_6497"

function signPayload(secret: string, ts: number, rawBody: string): string {
  const digest = createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`)
    .digest("hex")
  return `t=${ts},v1=${digest}`
}

test("PostgreSQL schema enforces RLS on all tables, integer money/score columns, and zero raw IP columns", async () => {
  const sql = postgres(TEST_DB_URL, { prepare: false, max: 2 })
  try {
    // 1. Every public application table has RLS enabled and forced
    const tables = await sql<
      { relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]
    >`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `
    assert.ok(tables.length >= 4, "Expected all 4 public tables to exist")
    for (const t of tables) {
      assert.equal(
        t.relrowsecurity,
        true,
        `Table ${t.relname} must have RLS enabled`
      )
      assert.equal(
        t.relforcerowsecurity,
        true,
        `Table ${t.relname} must have FORCE RLS enabled`
      )
    }

    // 2. Money/stipend/score columns are strictly integer types
    const moneyCols = await sql<
      { table_name: string; column_name: string; data_type: string }[]
    >`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN (
          'approved_stipend_cents',
          'stipend_delta_cents',
          'score_points',
          'total_questions'
        )
    `
    assert.equal(moneyCols.length, 4)
    for (const col of moneyCols) {
      assert.ok(
        col.data_type === "integer" || col.data_type === "bigint",
        `Expected ${col.table_name}.${col.column_name} to be integer, got ${col.data_type}`
      )
    }

    // 3. Zero columns hold a raw IP (word-boundary regex, so stripe_session_id passes cleanly)
    const rawIpCols = await sql<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name ~ '(^|_)ip($|_)'
    `
    assert.equal(
      rawIpCols.length,
      0,
      `Found prohibited raw IP columns: ${JSON.stringify(rawIpCols)}`
    )
  } finally {
    await sql.end()
  }
})

test("Advisor sign-off HMAC webhook credits once on replay & same-session re-delivery, and rejects unsigned/tampered calls", async () => {
  process.env.DATABASE_URL = TEST_DB_URL
  process.env.WEBHOOK_SIGNING_SECRET = TEST_WEBHOOK_SECRET
  process.env.ADMIN_SECRET = TEST_ADMIN_SECRET
  process.env.IP_HASH_SECRET = "ip_salt_test_6497"

  const { POST: webhookPost } = await import(
    "../app/api/webhooks/advisor-signoff/route"
  )
  const { POST: adminSeedPost } = await import("../app/api/admin/seed/route")

  const sql = postgres(TEST_DB_URL, { prepare: false, max: 2 })
  const testLessonId = `test-l10-${Date.now()}`
  const sessionTag = `sess_wostep_${Date.now()}`
  const evt1 = `evt_1_${Date.now()}`
  const evt2 = `evt_2_${Date.now()}`

  try {
    const nowSec = Math.floor(Date.now() / 1000)
    const validBody = JSON.stringify({
      event_id: evt1,
      session_id: sessionTag,
      advisor_handle: "henri.delacroix@wostep.ch",
      lesson_id: testLessonId,
      provider_stipend_cents: 32500,
      client_estimated_cents: 999999, // ignored in favor of provider_stipend_cents
    })

    // Case 1: Unsigned request -> 401
    const unsignedRes = await webhookPost(
      new Request("http://localhost:3000/api/webhooks/advisor-signoff", {
        method: "POST",
        body: validBody,
      })
    )
    assert.equal(unsignedRes.status, 401)

    // Case 2: Tampered payload with original signature -> 401
    const validSig = signPayload(TEST_WEBHOOK_SECRET, nowSec, validBody)
    const tamperedBody = validBody.replace("32500", "90000")
    const tamperedRes = await webhookPost(
      new Request("http://localhost:3000/api/webhooks/advisor-signoff", {
        method: "POST",
        headers: { "x-etabli-signature": validSig },
        body: tamperedBody,
      })
    )
    assert.equal(tamperedRes.status, 401)

    // Case 3: Happy path -> 200, credits provider's 32500 cents
    const okRes = await webhookPost(
      new Request("http://localhost:3000/api/webhooks/advisor-signoff", {
        method: "POST",
        headers: { "x-etabli-signature": validSig },
        body: validBody,
      })
    )
    assert.equal(okRes.status, 200)
    const okJson = (await okRes.json()) as {
      replayed: boolean
      approvedStipendCents: number
      eventsCount: number
    }
    assert.equal(okJson.replayed, false)
    assert.equal(okJson.approvedStipendCents, 32500)
    assert.equal(okJson.eventsCount, 1)

    // Case 4: Exact replay of evt1 -> 200 replayed: true, no second credit
    const replayRes = await webhookPost(
      new Request("http://localhost:3000/api/webhooks/advisor-signoff", {
        method: "POST",
        headers: { "x-etabli-signature": validSig },
        body: validBody,
      })
    )
    assert.equal(replayRes.status, 200)
    const replayJson = (await replayRes.json()) as {
      replayed: boolean
      approvedStipendCents: number
    }
    assert.equal(replayJson.replayed, true)
    assert.equal(replayJson.approvedStipendCents, 32500)

    // Case 5: Different event_id for the SAME session_id -> 200 replayed: true, still credits once
    const secondEventBody = JSON.stringify({
      event_id: evt2,
      session_id: sessionTag,
      advisor_handle: "henri.delacroix@wostep.ch",
      lesson_id: testLessonId,
      provider_stipend_cents: 32500,
    })
    const sig2 = signPayload(TEST_WEBHOOK_SECRET, nowSec, secondEventBody)
    const sameSessionRes = await webhookPost(
      new Request("http://localhost:3000/api/webhooks/advisor-signoff", {
        method: "POST",
        headers: { "x-etabli-signature": sig2 },
        body: secondEventBody,
      })
    )
    assert.equal(sameSessionRes.status, 200)
    const sameSessionJson = (await sameSessionRes.json()) as {
      replayed: boolean
      approvedStipendCents: number
      eventsCount: number
    }
    assert.equal(sameSessionJson.replayed, true)
    assert.equal(sameSessionJson.approvedStipendCents, 32500)
    assert.equal(sameSessionJson.eventsCount, 1)

    // Case 6: Admin seed route refuses 401 without secret and seeds cleanly with secret
    const unauthAdmin = await adminSeedPost(
      new Request("http://localhost:3000/api/admin/seed", { method: "POST" })
    )
    assert.equal(unauthAdmin.status, 401)

    const authAdmin = await adminSeedPost(
      new Request("http://localhost:3000/api/admin/seed", {
        method: "POST",
        headers: { authorization: `Bearer ${TEST_ADMIN_SECRET}` },
      })
    )
    assert.equal(authAdmin.status, 200)
  } finally {
    await sql`DELETE FROM advisor_lesson_reviews WHERE lesson_id = ${testLessonId}`
    await sql.end()
  }
})
