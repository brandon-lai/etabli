// TypeScript host interface & deterministic fallback for public/wasm/horology.wasm

export type WatchPosition = "DU" | "DD" | "CU" | "CD" | "CL" | "CR"

export const WATCH_POSITIONS: readonly {
  code: WatchPosition
  index: number
  label: string
  orientationNote: string
}[] = [
  {
    code: "DU",
    index: 0,
    label: "Dial Up",
    orientationNote: "Flat on lower Incabloc capstone; primary bench test position.",
  },
  {
    code: "DD",
    index: 1,
    label: "Dial Down",
    orientationNote: "Flat on upper balance cock capstone; wrist-equivalent flat check.",
  },
  {
    code: "CU",
    index: 2,
    label: "Crown Up",
    orientationNote: "Pendant right / 3H up; radial pivot contact + gravity poise check.",
  },
  {
    code: "CD",
    index: 3,
    label: "Crown Down",
    orientationNote: "9H up; opposes Crown Up poise vector to expose heavy spot on rim.",
  },
  {
    code: "CL",
    index: 4,
    label: "Crown Left",
    orientationNote: "12H up pocket-hanging attitude; pocket-watch wear primary vertical.",
  },
  {
    code: "CR",
    index: 5,
    label: "Crown Right",
    orientationNote: "6H up vertical check completing the 6-position COSC/atelier matrix.",
  },
] as const

export const EVENT_NONE = 0
export const EVENT_UNLOCK = 1
export const EVENT_IMPULSE = 2
export const EVENT_DROP = 4
export const EVENT_KNOCK = 8

// SharedArrayBuffer Float64 slot indices (16 x f64 = 128 bytes)
export const SAB_SLOTS = {
  SIM_TIME: 0,
  BALANCE_ANGLE: 1,
  BALANCE_OMEGA: 2,
  PALLET_ANGLE: 3,
  ESCAPE_ANGLE: 4,
  FOURTH_ANGLE: 5,
  THIRD_ANGLE: 6,
  CENTER_ANGLE: 7,
  BARREL_ANGLE: 8,
  WIND_FRACTION: 9,
  AMPLITUDE_DEG: 10,
  RATE_SEC_DAY: 11,
  BEAT_ERROR_MS: 12,
  BEAT_COUNT: 13,
  LAST_BEAT_MS: 14,
  HAIRSPRING_MM: 15,
} as const

export interface ServiceConditionState {
  trainOilQuality: number
  palletOilQuality: number
  balanceOilQuality: number
  overOiledFactor: number
  escapementTeethOiled: number
  magnetizedFactor: number
  bentPivotFactor: number
  daysElapsed: number
}

export interface HorologySnapshot {
  simTimeSec: number
  balanceAngleRad: number
  balanceOmega: number
  palletAngleRad: number
  escapeWheelAngleRad: number
  fourthWheelAngleRad: number
  thirdWheelAngleRad: number
  centerWheelAngleRad: number
  barrelAngleRad: number
  windFraction: number
  amplitudeDeg: number
  rateSecPerDay: number
  beatErrorMs: number
  beatCount: number
  lastBeatIntervalMs: number
  hairspringActiveLengthMm: number
  eventFlags: number
}

export interface TimegrapherDot {
  id: number
  beatIndex: number
  simTimeSec: number
  phaseOffsetMs: number
  isTick: boolean
  amplitudeDeg: number
  rateSecPerDay: number
  beatErrorMs: number
}

export interface HorologyWasmExports {
  resetSimulation(kickStart: number): void
  giveBalanceImpulse(radPerSec: number): void
  setAssemblyState(oscillatorReady: number, escapementReady: number, trainReady: number): void
  setWindFraction(value: number): void
  setRegulatorMicrons(microns: number): void
  setColletOffsetDeg(deg: number): void
  setPosition(pos: number): void
  setServiceConditions(
    trainOil: number,
    palletOil: number,
    balanceOil: number,
    overOiled: number,
    escapeTeethOiled: number,
    magnetized: number,
    bentPivot: number,
    simDays: number
  ): void
  stepBatch(steps: number): number
  getSimTimeSec(): number
  getBalanceAngleRad(): number
  getBalanceOmega(): number
  getPalletAngleRad(): number
  getEscapeWheelAngleRad(): number
  getFourthWheelAngleRad(): number
  getThirdWheelAngleRad(): number
  getCenterWheelAngleRad(): number
  getBarrelAngleRad(): number
  getWindFraction(): number
  getAmplitudeDeg(): number
  getRateSecPerDay(): number
  getBeatErrorMs(): number
  getBeatCount(): number
  getLastBeatIntervalMs(): number
  getHairspringActiveLengthMm(): number
}

export const CLEAN_SERVICE_CONDITIONS: ServiceConditionState = {
  trainOilQuality: 1.0,
  palletOilQuality: 1.0,
  balanceOilQuality: 1.0,
  overOiledFactor: 0.0,
  escapementTeethOiled: 0.0,
  magnetizedFactor: 0.0,
  bentPivotFactor: 0.0,
  daysElapsed: 0.0,
}

export const ARRIVAL_GUMMED_CONDITIONS: ServiceConditionState = {
  trainOilQuality: 0.36,
  palletOilQuality: 0.34,
  balanceOilQuality: 0.42,
  overOiledFactor: 0.15,
  escapementTeethOiled: 0.0,
  magnetizedFactor: 0.0,
  bentPivotFactor: 0.0,
  daysElapsed: 9.0,
}

export function positionToIndex(pos: WatchPosition): number {
  const found = WATCH_POSITIONS.find((p) => p.code === pos)
  return found ? found.index : 0
}

export function readWasmSnapshot(
  wasm: HorologyWasmExports,
  eventFlags = 0
): HorologySnapshot {
  return {
    simTimeSec: wasm.getSimTimeSec(),
    balanceAngleRad: wasm.getBalanceAngleRad(),
    balanceOmega: wasm.getBalanceOmega(),
    palletAngleRad: wasm.getPalletAngleRad(),
    escapeWheelAngleRad: wasm.getEscapeWheelAngleRad(),
    fourthWheelAngleRad: wasm.getFourthWheelAngleRad(),
    thirdWheelAngleRad: wasm.getThirdWheelAngleRad(),
    centerWheelAngleRad: wasm.getCenterWheelAngleRad(),
    barrelAngleRad: wasm.getBarrelAngleRad(),
    windFraction: wasm.getWindFraction(),
    amplitudeDeg: wasm.getAmplitudeDeg(),
    rateSecPerDay: wasm.getRateSecPerDay(),
    beatErrorMs: wasm.getBeatErrorMs(),
    beatCount: wasm.getBeatCount(),
    lastBeatIntervalMs: wasm.getLastBeatIntervalMs(),
    hairspringActiveLengthMm: wasm.getHairspringActiveLengthMm(),
    eventFlags,
  }
}

export function readSharedBufferSnapshot(
  f64: Float64Array,
  eventFlags = 0
): HorologySnapshot {
  return {
    simTimeSec: f64[SAB_SLOTS.SIM_TIME],
    balanceAngleRad: f64[SAB_SLOTS.BALANCE_ANGLE],
    balanceOmega: f64[SAB_SLOTS.BALANCE_OMEGA],
    palletAngleRad: f64[SAB_SLOTS.PALLET_ANGLE],
    escapeWheelAngleRad: f64[SAB_SLOTS.ESCAPE_ANGLE],
    fourthWheelAngleRad: f64[SAB_SLOTS.FOURTH_ANGLE],
    thirdWheelAngleRad: f64[SAB_SLOTS.THIRD_ANGLE],
    centerWheelAngleRad: f64[SAB_SLOTS.CENTER_ANGLE],
    barrelAngleRad: f64[SAB_SLOTS.BARREL_ANGLE],
    windFraction: f64[SAB_SLOTS.WIND_FRACTION],
    amplitudeDeg: f64[SAB_SLOTS.AMPLITUDE_DEG],
    rateSecPerDay: f64[SAB_SLOTS.RATE_SEC_DAY],
    beatErrorMs: f64[SAB_SLOTS.BEAT_ERROR_MS],
    beatCount: Math.round(f64[SAB_SLOTS.BEAT_COUNT]),
    lastBeatIntervalMs: f64[SAB_SLOTS.LAST_BEAT_MS],
    hairspringActiveLengthMm: f64[SAB_SLOTS.HAIRSPRING_MM],
    eventFlags,
  }
}

export async function instantiateHorologyWasm(
  wasmBytes: BufferSource
): Promise<HorologyWasmExports> {
  const { instance } = await WebAssembly.instantiate(wasmBytes, {
    env: {
      abort() {
        // Deterministic horology module never allocates managed objects
      },
    },
  })
  return instance.exports as unknown as HorologyWasmExports
}

export function evaluate6497Health(snapshot: HorologySnapshot, position: WatchPosition) {
  const minAmp = position === "DU" || position === "DD" ? 270 : 240
  const maxAmp = 315
  const amplitudeHealthy =
    snapshot.amplitudeDeg >= minAmp && snapshot.amplitudeDeg <= maxAmp
  const beatHealthy = snapshot.beatErrorMs < 0.5
  const rateHealthy = Math.abs(snapshot.rateSecPerDay) <= 8.0

  return {
    healthy: amplitudeHealthy && beatHealthy && rateHealthy,
    amplitudeHealthy,
    beatHealthy,
    rateHealthy,
    minAmp,
    maxAmp,
  }
}
