import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import {
  ALL_INSTALLED_PART_IDS,
  CALIBER_6497_PARTS,
  getBlockingPartsForRemoval,
  getMissingPartsForInstall,
  TOTAL_6497_JEWELS,
} from "../lib/horology/caliber6497"
import {
  ASK_HENRI_CORPUS,
  COURSE_1_LESSONS,
  HOROLOGY_20_QUIZ,
  queryAskHenri,
} from "../lib/horology/course1"
import {
  evaluate6497Health,
  type HorologyWasmExports,
} from "../lib/horology/physics"

async function createWasmCore(): Promise<HorologyWasmExports> {
  const wasmPath = path.join(process.cwd(), "public", "wasm", "horology.wasm")
  const bytes = readFileSync(wasmPath)
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: { abort() {} },
  })
  const core = instance.exports as unknown as HorologyWasmExports
  core.resetSimulation(1)
  return core
}

test("10 kHz WASM Unitas 6497-1 clean full-wind Dial-Up hits 270°-315° and 18,000 vph", async () => {
  const core = await createWasmCore()
  core.setPosition(0) // DU
  core.setWindFraction(1.0)
  core.setServiceConditions(1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0)
  core.stepBatch(150_000) // 15.0 seconds at 10,000 Hz

  const amp = core.getAmplitudeDeg()
  const rate = core.getRateSecPerDay()
  const beatErr = core.getBeatErrorMs()
  const beats = core.getBeatCount()

  assert.ok(
    amp >= 270 && amp <= 315,
    `Expected clean DU amplitude in 270..315 deg, got ${amp.toFixed(2)}`
  )
  assert.ok(
    Math.abs(rate) < 2.0,
    `Expected neutral regulator rate within +-2.0 s/d, got ${rate.toFixed(2)}`
  )
  assert.ok(
    beatErr < 0.05,
    `Expected zeroed collet beat error < 0.05 ms, got ${beatErr.toFixed(3)}`
  )
  assert.ok(
    beats >= 74 && beats <= 76,
    `Expected ~75 beats in 15s at 18,000 vph (5 Hz beat), got ${beats}`
  )

  const health = evaluate6497Health(
    {
      simTimeSec: 15,
      balanceAngleRad: 0,
      balanceOmega: 0,
      palletAngleRad: 0,
      escapeWheelAngleRad: 0,
      fourthWheelAngleRad: 0,
      thirdWheelAngleRad: 0,
      centerWheelAngleRad: 0,
      barrelAngleRad: 0,
      windFraction: 1,
      amplitudeDeg: amp,
      rateSecPerDay: rate,
      beatErrorMs: beatErr,
      beatCount: beats,
      lastBeatIntervalMs: 200,
      hairspringActiveLengthMm: 140,
      eventFlags: 0,
    },
    "DU"
  )
  assert.equal(health.healthy, true)
})

test("Positional gravity drop, regulator index, collet beat error, and 14-day oil creep", async () => {
  const core = await createWasmCore()
  core.stepBatch(120_000)
  const ampDU = core.getAmplitudeDeg()

  // Crown Up vertical gravity drop
  core.setPosition(2) // CU
  core.stepBatch(100_000)
  const ampCU = core.getAmplitudeDeg()
  assert.ok(
    ampCU < ampDU - 5 && ampCU >= 240,
    `Expected Crown-Up amplitude (${ampCU.toFixed(1)}) lower than Dial-Up (${ampDU.toFixed(1)})`
  )

  // Collet offset creates beat error
  core.setPosition(0)
  core.setColletOffsetDeg(2.0)
  core.stepBatch(40_000)
  assert.ok(
    core.getBeatErrorMs() > 0.7,
    `Expected 2.0 deg collet offset to raise beat error > 0.7 ms, got ${core.getBeatErrorMs()}`
  )

  // Regulator index shifts daily rate fast (+100 um on 184.3 mm spiral => ~+23.4 s/d)
  core.setColletOffsetDeg(0)
  core.setRegulatorMicrons(100)
  core.stepBatch(120_000)
  assert.ok(
    core.getRateSecPerDay() > 15,
    `Expected +100 um curb pin advance to gain > +15 s/d, got ${core.getRateSecPerDay()}`
  )

  // Over-oiled creep after 14 days drops amplitude dramatically
  core.setRegulatorMicrons(0)
  core.setServiceConditions(1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0)
  core.stepBatch(80_000)
  const day0Amp = core.getAmplitudeDeg()

  core.setServiceConditions(1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 14.0)
  core.stepBatch(100_000)
  const day14Amp = core.getAmplitudeDeg()
  assert.ok(
    day0Amp - day14Amp > 40,
    `Expected 14-day oil creep to drop amplitude by >40 deg (${day0Amp.toFixed(1)} -> ${day14Amp.toFixed(1)})`
  )
})

test("Calibre 6497-1 17-jewel inventory, physical dependency graph, and curriculum integrity", () => {
  const computedJewels = CALIBER_6497_PARTS.reduce(
    (sum, p) => sum + p.jewelCount,
    0
  )
  assert.equal(computedJewels, TOTAL_6497_JEWELS)
  assert.equal(TOTAL_6497_JEWELS, 17, "ETA 6497-1 must total 17 synthetic rubies")
  assert.equal(COURSE_1_LESSONS.length, 11, "Course 1 must have 11 lessons")
  assert.equal(HOROLOGY_20_QUIZ.length, 20, "Assessment must have 20 questions")
  assert.ok(ASK_HENRI_CORPUS.length >= 7, "Ask Henri corpus must have cited entries")

  const fullInstalled = new Set<string>(ALL_INSTALLED_PART_IDS)

  // Lifting train bridge while mainspring is wound is flagged
  const woundBridgeCheck = getBlockingPartsForRemoval(
    "train_bridge",
    fullInstalled,
    false
  )
  assert.equal(woundBridgeCheck.needsLetDown, true)

  // Fourth wheel is physically blocked by train bridge and sub-seconds hand
  const fourthBlocked = getBlockingPartsForRemoval(
    "fourth_wheel",
    fullInstalled,
    true
  )
  assert.equal(fourthBlocked.blocked, true)
  assert.ok(fourthBlocked.blockers.some((b) => b.id === "train_bridge"))

  // Train bridge cannot mount if escape wheel is missing
  const missingEscape = new Set([
    "mainplate",
    "center_wheel",
    "third_wheel",
    "fourth_wheel",
  ])
  const mountBridge = getMissingPartsForInstall("train_bridge", missingEscape)
  assert.equal(mountBridge.canMount, false)
  assert.ok(mountBridge.missing.some((m) => m.id === "escape_wheel"))

  // Cited Ask Henri lookup finds left-hand crown wheel screw warning
  const results = queryAskHenri("left-hand crown wheel screw")
  assert.equal(results.matched, true)
  assert.equal(results.cards[0].id, "ref-lefthand")
})
