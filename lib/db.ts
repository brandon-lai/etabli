// Lazy PostgreSQL / Supabase connection (postgres.js) cached on globalThis.
// Uses { prepare: false } for Supabase transaction-pooler (port 6543) safety,
// and exposes hasDatabase() so the entire product runs deterministically with
// zero environment variables configured.

import { createHash, timingSafeEqual } from "node:crypto"
import postgres, { type Sql } from "postgres"

const globalForDb = globalThis as unknown as {
  __etabliSql?: Sql
  __etabliSqlUrl?: string
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0)
}

export function getSql(): Sql {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }
  if (!globalForDb.__etabliSql || globalForDb.__etabliSqlUrl !== url) {
    globalForDb.__etabliSql = postgres(url, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    globalForDb.__etabliSqlUrl = url
  }
  return globalForDb.__etabliSql
}

export function hashClientFingerprint(requestHeaders: Headers): string {
  const forwarded =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "local-bench"
  const secret = process.env.IP_HASH_SECRET || "etabli-dev-daily-salt"
  const dayKey = new Date().toISOString().slice(0, 10)
  return createHash("sha256")
    .update(`${secret}:${dayKey}:${forwarded}`)
    .digest("hex")
}

export function verifyBearerOrHeaderSecret(
  provided: string | null | undefined,
  expected: string | undefined
): boolean {
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
