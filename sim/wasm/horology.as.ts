// Établi — Deterministic 10 kHz Unitas / ETA 6497-1 Horology Core (AssemblyScript -> WASM)
// Models:
//   1. Glucydur balance + Nivarox 1 hairspring: T = 2 * pi * sqrt(I / k), k = (E * h * t^3) / (12 * L_eff)
//   2. Nivaflex manual-wind mainspring barrel (84t) + 4-wheel going train (80/12, 75/10, 80/10, 15/8)
//   3. Club-tooth Swiss lever escapement (15t, 44.0 deg lift angle: unlock, impulse, drop, lock, draw)
//   4. 6-position gravity poise & capstone vs radial jewel friction (DU, DD, CU, CD, CL, CR)
//   5. Moebius lubrication state, 14-day oil creep aging, magnetization, and collet beat error

const PI: f64 = 3.14159265358979323846
const TWO_PI: f64 = 6.28318530717958647692
const DEG_TO_RAD: f64 = 0.01745329251994329577
const RAD_TO_DEG: f64 = 57.2957795130823208768

// Fixed 10 kHz integrator timestep (100 microseconds)
const DT: f64 = 0.0001

// ETA / Unitas 6497-1 nominal physical parameters
const BALANCE_INERTIA: f64 = 1.95e-9 // kg*m^2 (19.5 mg*cm^2, 16.5-ligne Glucydur balance)
const HAIRSPRING_E: f64 = 2.02e11 // Pa (Nivarox 1 Young's modulus)
const HAIRSPRING_H: f64 = 2.4e-4 // m (0.24 mm strip height)
const HAIRSPRING_T: f64 = 2.8e-5 // m (0.028 mm strip thickness)
// Nominal active length L0 calibrated so k0 = I * (2 * pi * 2.5 Hz)^2 -> 18,000 vph
const HAIRSPRING_L0: f64 = 0.18432350228862898

// 44.0 deg lift angle -> +/- 22.0 deg balance roller engagement zone
const HALF_LIFT_RAD: f64 = 22.0 * DEG_TO_RAD
const UNLOCK_END_RAD: f64 = -16.0 * DEG_TO_RAD
const IMPULSE_END_RAD: f64 = 18.0 * DEG_TO_RAD
const KNOCKING_RAD: f64 = 328.0 * DEG_TO_RAD

// Damping & escapement torque calibrated for Q=220 Dial Up -> ~296 deg @ full wind
const BASE_VISCOUS_DU: f64 = 1.3923e-10 // N*m*s/rad
const BASE_IMPULSE_TORQUE: f64 = 1.5851e-7 // N*m across 34 deg impulse plane
const BASE_UNLOCK_TORQUE: f64 = 2.20e-8 // N*m opposing motion across 6 deg unlock

// Acoustic event bitflags emitted during stepBatch()
export const EVENT_NONE: i32 = 0
export const EVENT_UNLOCK: i32 = 1
export const EVENT_IMPULSE: i32 = 2
export const EVENT_DROP: i32 = 4
export const EVENT_KNOCK: i32 = 8

// Position enum: 0=DU, 1=DD, 2=CU, 3=CD, 4=CL, 5=CR
let position: i32 = 0

// Assembly completeness flags (1 = installed & seated, 0 = absent)
let canOscillate: i32 = 1
let escapementInstalled: i32 = 1
let trainInstalled: i32 = 1

// Physical state
let simTimeSec: f64 = 0.0
let theta: f64 = 0.0 // Balance angle (rad)
let omega: f64 = 0.0 // Balance angular velocity (rad/s)
let palletSide: i32 = 1 // +1 banked right, -1 banked left
let palletAngleRad: f64 = 0.0872664626 // +/- 5.0 deg pallet fork travel
let escapeWheelAngleRad: f64 = 0.0
let fourthWheelAngleRad: f64 = 0.0
let thirdWheelAngleRad: f64 = 0.0
let centerWheelAngleRad: f64 = 0.0
let barrelAngleRad: f64 = 0.0

// Winding & regulation parameters
let windFraction: f64 = 1.0 // 0.0 (let down) .. 1.0 (full wind, ~46h reserve)
let regulatorMicrons: f64 = 0.0 // -600 .. +600 um active hairspring length delta
let colletOffsetRad: f64 = 0.0 // Collet angle error causing beat error
let poiseEccentricityNm: f64 = 3.8e-10 // Tiny realistic balance poise vector

// Service / fault modifiers
let trainOilQuality: f64 = 1.0 // 1.0 clean Moebius 9010/HP1300, <1 dry/old
let palletOilQuality: f64 = 1.0 // 1.0 clean Moebius 9415, <1 dry/flooded
let balanceOilQuality: f64 = 1.0 // 1.0 clean Moebius 9010 on Incabloc capstones
let overOiledFactor: f64 = 0.0 // 0.0 proper meniscus .. 1.0 flooded sink
let escapementTeethOiled: f64 = 0.0 // 1.0 if apprentice wrongly oiled escape teeth/pallet pivots
let daysElapsed: f64 = 0.0 // Simulated wear/creep time skip (e.g. 14 days)
let magnetizedFactor: f64 = 0.0 // 0.0 demagnetized .. 1.0 strongly magnetized
let bentPivotFactor: f64 = 0.0 // 0.0 straight .. 1.0 damaged pivot from forced bridge

// Escapement tracking per swing
let swingStage: i32 = 0 // 0 = free outside lift, 1 = unlocking, 2 = impulsing, 3 = drop completed
let peakAbsTheta: f64 = 0.0
let measuredAmplitudeDeg: f64 = 0.0
let lastUnlockTimeA: f64 = -1.0
let lastUnlockTimeB: f64 = -1.0
let measuredRateSecPerDay: f64 = 0.0
let measuredBeatErrorMs: f64 = 0.0
let beatCount: i32 = 0
let lastEventFlags: i32 = 0
let lastBeatIntervalMs: f64 = 200.0

function computeHairspringK(): f64 {
  let effectiveL: f64 = HAIRSPRING_L0 - regulatorMicrons * 1.0e-6
  // Magnetized coils cling slightly, shortening active length (+112 s/d at factor 1.0)
  if (magnetizedFactor > 0.0) {
    effectiveL *= 1.0 - 0.0026 * magnetizedFactor
  }
  // Oil creep onto hairspring coils after time skip causes intermittent coil adhesion
  let creep: f64 = overOiledFactor * (1.0 - Math.exp(-daysElapsed / 5.0))
  if (creep > 0.0) {
    effectiveL *= 1.0 - 0.0009 * creep
  }
  if (effectiveL < 0.05) effectiveL = 0.05
  let t3: f64 = HAIRSPRING_T * HAIRSPRING_T * HAIRSPRING_T
  return (HAIRSPRING_E * HAIRSPRING_H * t3) / (12.0 * effectiveL)
}

function computeMainspringTorqueFactor(): f64 {
  if (windFraction <= 0.005 || trainInstalled == 0 || escapementInstalled == 0) {
    return 0.0
  }
  // Nivaflex alloy mainspring torque curve: flat plateau across middle wind, gentle tail-off
  let w: f64 = windFraction
  if (w > 1.0) w = 1.0
  let baseCurve: f64 = 0.58 + 0.42 * Math.pow(w, 0.42)
  // Train lubrication efficiency
  let creepPenalty: f64 = overOiledFactor * (1.0 - Math.exp(-daysElapsed / 4.5)) * 0.28
  let dryWearPenalty: f64 = (1.0 - trainOilQuality) * (0.28 + 0.14 * Math.min(1.0, daysElapsed / 14.0))
  let teethOilPenalty: f64 = escapementTeethOiled * (0.08 + 0.22 * Math.min(1.0, daysElapsed / 7.0))
  let eff: f64 = (0.68 + 0.32 * trainOilQuality) * (0.72 + 0.28 * palletOilQuality)
  eff = eff * (1.0 - creepPenalty - dryWearPenalty - teethOilPenalty)
  if (eff < 0.15) eff = 0.15
  return baseCurve * eff
}

function computeViscousDamping(): f64 {
  let c: f64 = BASE_VISCOUS_DU
  // Flat positions (DU=0, DD=1) ride on spherical pivot ends; vertical positions (2..5) ride radially
  if (position == 1) {
    c *= 1.02
  } else if (position >= 2) {
    c *= 1.18
  }
  // Balance capstone oil quality
  let dryFactor: f64 = 1.0 + (1.0 - balanceOilQuality) * (0.34 + 0.18 * Math.min(1.0, daysElapsed / 14.0))
  let creepDrag: f64 = 1.0 + overOiledFactor * (0.06 + 0.44 * (1.0 - Math.exp(-daysElapsed / 5.0)))
  let bentDrag: f64 = 1.0 + bentPivotFactor * 0.85
  let magDrag: f64 = 1.0 + magnetizedFactor * 0.16
  return c * dryFactor * creepDrag * bentDrag * magDrag
}

function computePoiseDetuningK(kBase: f64): f64 {
  // In vertical positions (CU=2, CD=3, CL=4, CR=5), gravity acts on tiny balance poise eccentricity,
  // producing classic +/- 2..5 s/d positional rate differences across the 4 vertical orientations.
  if (position < 2) return kBase
  let orientSign: f64 = 0.0
  if (position == 2) orientSign = 1.0 // Crown Up
  else if (position == 3) orientSign = -1.0 // Crown Down
  else if (position == 4) orientSign = 0.55 // Crown Left
  else if (position == 5) orientSign = -0.45 // Crown Right
  // Amplitude-dependent Bessel J1 poise effect in vertical positions (+/- 3..4 s/d across CU/CD/CL/CR)
  let ampFactor: f64 = 1.0 - Math.min(0.65, measuredAmplitudeDeg / 480.0)
  return kBase * (1.0 + orientSign * 0.000095 * ampFactor)
}

export function resetSimulation(kickStart: i32): void {
  simTimeSec = 0.0
  theta = colletOffsetRad
  omega = kickStart != 0 && canOscillate != 0 ? 78.0 : 0.0
  palletSide = -1
  palletAngleRad = -5.0 * DEG_TO_RAD
  escapeWheelAngleRad = 0.0
  fourthWheelAngleRad = 0.0
  thirdWheelAngleRad = 0.0
  centerWheelAngleRad = 0.0
  barrelAngleRad = 0.0
  swingStage = 0
  peakAbsTheta = kickStart != 0 ? 275.0 * DEG_TO_RAD : 0.0
  measuredAmplitudeDeg = kickStart != 0 && canOscillate != 0 ? 275.0 : 0.0
  lastUnlockTimeA = -1.0
  lastUnlockTimeB = -1.0
  measuredRateSecPerDay = 0.0
  measuredBeatErrorMs = 0.0
  beatCount = 0
  lastEventFlags = 0
  lastBeatIntervalMs = 200.0
}

export function giveBalanceImpulse(radPerSec: f64): void {
  if (canOscillate != 0) {
    omega += radPerSec
  }
}

export function setAssemblyState(oscillatorReady: i32, escapementReady: i32, trainReady: i32): void {
  canOscillate = oscillatorReady
  escapementInstalled = escapementReady
  trainInstalled = trainReady
  if (canOscillate == 0) {
    omega = 0.0
    measuredAmplitudeDeg = 0.0
  }
}

export function setWindFraction(value: f64): void {
  if (value < 0.0) value = 0.0
  if (value > 1.0) value = 1.0
  windFraction = value
  if (windFraction > 0.08 && canOscillate != 0 && escapementInstalled != 0 && Math.abs(omega) < 2.0) {
    // Self-starting Swiss lever when balance sits inside lift zone on wind
    if (Math.abs(theta) < HALF_LIFT_RAD * 1.2) {
      omega = 28.0
    }
  }
}

export function setRegulatorMicrons(microns: f64): void {
  if (microns < -600.0) microns = -600.0
  if (microns > 600.0) microns = 600.0
  regulatorMicrons = microns
}

export function setColletOffsetDeg(deg: f64): void {
  if (deg < -6.0) deg = -6.0
  if (deg > 6.0) deg = 6.0
  colletOffsetRad = deg * DEG_TO_RAD
}

export function setPosition(pos: i32): void {
  if (pos < 0) pos = 0
  if (pos > 5) pos = 5
  position = pos
}

export function setServiceConditions(
  trainOil: f64,
  palletOil: f64,
  balanceOil: f64,
  overOiled: f64,
  escapeTeethOiled: f64,
  magnetized: f64,
  bentPivot: f64,
  simDays: f64
): void {
  trainOilQuality = trainOil
  palletOilQuality = palletOil
  balanceOilQuality = balanceOil
  overOiledFactor = overOiled
  escapementTeethOiled = escapeTeethOiled
  magnetizedFactor = magnetized
  bentPivotFactor = bentPivot
  daysElapsed = simDays
}

function advanceGearTrainOnBeat(): void {
  // 15-tooth escape wheel advances 1 half-tooth = 12.0 deg per beat (30 beats/rev -> 5 beats/s = 10 rpm)
  let escapeStep: f64 = 12.0 * DEG_TO_RAD
  escapeWheelAngleRad = (escapeWheelAngleRad + escapeStep) % TWO_PI
  // Fourth wheel (80t -> 8-leaf escape pinion = 10:1 -> 1.2 deg/beat -> 300 beats = 60.0s per rev!)
  fourthWheelAngleRad = (fourthWheelAngleRad + escapeStep / 10.0) % TWO_PI
  // Third wheel (75t -> 10-leaf fourth pinion = 7.5:1)
  thirdWheelAngleRad = (thirdWheelAngleRad + escapeStep / 75.0) % TWO_PI
  // Center wheel (80t -> 10-leaf third pinion = 8:1 -> 600:1 from escape -> 1 rev/hour)
  centerWheelAngleRad = (centerWheelAngleRad + escapeStep / 600.0) % TWO_PI
  // Mainspring barrel (84t -> 12-leaf center pinion = 7:1 -> 4200:1 from escape)
  barrelAngleRad = (barrelAngleRad + escapeStep / 4200.0) % TWO_PI

  // Gradual mainspring let-down over 46 hours (46 * 3600 * 5 = 828,000 beats)
  windFraction -= 1.0 / 828000.0
  if (windFraction < 0.0) windFraction = 0.0
}

function recordUnlockTimestamp(t: f64): void {
  if (lastUnlockTimeA > 0.0) {
    let dtLatest: f64 = t - lastUnlockTimeA
    if (dtLatest > 0.12 && dtLatest < 0.30) {
      lastBeatIntervalMs = dtLatest * 1000.0
      if (lastUnlockTimeB > 0.0) {
        let dtPrev: f64 = lastUnlockTimeA - lastUnlockTimeB
        if (dtPrev > 0.12 && dtPrev < 0.30) {
          let fullPeriod: f64 = dtLatest + dtPrev
          let instRate: f64 = 86400.0 * (0.4 / fullPeriod - 1.0)
          let instBeatErr: f64 = Math.abs(dtLatest - dtPrev) * 500.0
          if (beatCount < 6) {
            measuredRateSecPerDay = instRate
            measuredBeatErrorMs = instBeatErr
          } else {
            measuredRateSecPerDay = measuredRateSecPerDay * 0.72 + instRate * 0.28
            measuredBeatErrorMs = measuredBeatErrorMs * 0.72 + instBeatErr * 0.28
          }
        }
      }
    }
  }
  lastUnlockTimeB = lastUnlockTimeA
  lastUnlockTimeA = t
  beatCount += 1
}

export function stepBatch(steps: i32): i32 {
  let events: i32 = EVENT_NONE
  if (canOscillate == 0) {
    lastEventFlags = EVENT_NONE
    return EVENT_NONE
  }

  let kBase: f64 = computeHairspringK()
  let kEff: f64 = computePoiseDetuningK(kBase)
  let cVisc: f64 = computeViscousDamping()
  let torqueFactor: f64 = computeMainspringTorqueFactor()
  let impTorqueMag: f64 = BASE_IMPULSE_TORQUE * torqueFactor
  let unlockTorqueMag: f64 = BASE_UNLOCK_TORQUE * (0.6 + 0.4 * torqueFactor)

  for (let i: i32 = 0; i < steps; i++) {
    let prevOmega: f64 = omega
    let dispFromEq: f64 = theta - colletOffsetRad
    let absDisp: f64 = Math.abs(dispFromEq)
    if (absDisp > peakAbsTheta) {
      peakAbsTheta = absDisp
    }

    let tauEsc: f64 = 0.0

    // Swiss lever escapement engagement across [-22 deg, +22 deg] around dead-center (theta = 0)
    if (escapementInstalled != 0 && torqueFactor > 0.01) {
      // Direction +1: swinging left-to-right (omega > 0) while pallet was banked on -1
      if (omega > 0.0 && palletSide == -1) {
        if (theta >= -HALF_LIFT_RAD && theta < UNLOCK_END_RAD) {
          if (swingStage == 0) {
            swingStage = 1
            events |= EVENT_UNLOCK
            recordUnlockTimestamp(simTimeSec)
          }
          tauEsc = -unlockTorqueMag
        } else if (theta >= UNLOCK_END_RAD && theta < IMPULSE_END_RAD) {
          if (swingStage < 2) {
            swingStage = 2
            events |= EVENT_IMPULSE
          }
          tauEsc = impTorqueMag
          let frac: f64 = (theta - UNLOCK_END_RAD) / (IMPULSE_END_RAD - UNLOCK_END_RAD)
          palletAngleRad = (-5.0 + 10.0 * frac) * DEG_TO_RAD
        } else if (theta >= IMPULSE_END_RAD && swingStage == 2) {
          swingStage = 3
          palletSide = 1
          palletAngleRad = 5.0 * DEG_TO_RAD
          advanceGearTrainOnBeat()
          events |= EVENT_DROP
        }
      } else if (omega < 0.0 && palletSide == 1) {
        // Direction -1: swinging right-to-left (omega < 0) while pallet was banked on +1
        let mirTheta: f64 = -theta
        if (mirTheta >= -HALF_LIFT_RAD && mirTheta < UNLOCK_END_RAD) {
          if (swingStage == 0) {
            swingStage = 1
            events |= EVENT_UNLOCK
            recordUnlockTimestamp(simTimeSec)
          }
          tauEsc = unlockTorqueMag
        } else if (mirTheta >= UNLOCK_END_RAD && mirTheta < IMPULSE_END_RAD) {
          if (swingStage < 2) {
            swingStage = 2
            events |= EVENT_IMPULSE
          }
          tauEsc = -impTorqueMag
          let frac: f64 = (mirTheta - UNLOCK_END_RAD) / (IMPULSE_END_RAD - UNLOCK_END_RAD)
          palletAngleRad = (5.0 - 10.0 * frac) * DEG_TO_RAD
        } else if (mirTheta >= IMPULSE_END_RAD && swingStage == 2) {
          swingStage = 3
          palletSide = -1
          palletAngleRad = -5.0 * DEG_TO_RAD
          advanceGearTrainOnBeat()
          events |= EVENT_DROP
        }
      }
    }

    // Symplectic semi-implicit Euler integration at 10 kHz
    let alpha: f64 = (-kEff * dispFromEq - cVisc * omega + tauEsc) / BALANCE_INERTIA
    omega += alpha * DT
    theta += omega * DT
    simTimeSec += DT

    // Banking / knocking check if roller jewel strikes outside of fork horns (> 328 deg)
    if (Math.abs(theta) > KNOCKING_RAD) {
      theta = theta > 0.0 ? KNOCKING_RAD : -KNOCKING_RAD
      omega = -omega * 0.65
      events |= EVENT_KNOCK
    }

    // Turnaround detection: latch peak amplitude for this half-swing & reset swingStage
    if ((prevOmega > 0.0 && omega <= 0.0) || (prevOmega < 0.0 && omega >= 0.0)) {
      let turnDeg: f64 = peakAbsTheta * RAD_TO_DEG
      if (measuredAmplitudeDeg < 1.0) {
        measuredAmplitudeDeg = turnDeg
      } else {
        measuredAmplitudeDeg = measuredAmplitudeDeg * 0.65 + turnDeg * 0.35
      }
      peakAbsTheta = 0.0
      swingStage = 0
    }
  }

  if (Math.abs(omega) < 0.05 && Math.abs(theta - colletOffsetRad) < 0.01 && torqueFactor <= 0.01) {
    measuredAmplitudeDeg *= 0.92
  }

  lastEventFlags = events
  return events
}

// Telemetry getters for Worker / SharedArrayBuffer sync
export function getSimTimeSec(): f64 {
  return simTimeSec
}
export function getBalanceAngleRad(): f64 {
  return theta
}
export function getBalanceOmega(): f64 {
  return omega
}
export function getPalletAngleRad(): f64 {
  return palletAngleRad
}
export function getEscapeWheelAngleRad(): f64 {
  return escapeWheelAngleRad
}
export function getFourthWheelAngleRad(): f64 {
  return fourthWheelAngleRad
}
export function getThirdWheelAngleRad(): f64 {
  return thirdWheelAngleRad
}
export function getCenterWheelAngleRad(): f64 {
  return centerWheelAngleRad
}
export function getBarrelAngleRad(): f64 {
  return barrelAngleRad
}
export function getWindFraction(): f64 {
  return windFraction
}
export function getAmplitudeDeg(): f64 {
  return measuredAmplitudeDeg
}
export function getRateSecPerDay(): f64 {
  return measuredRateSecPerDay
}
export function getBeatErrorMs(): f64 {
  return measuredBeatErrorMs
}
export function getBeatCount(): i32 {
  return beatCount
}
export function getLastBeatIntervalMs(): f64 {
  return lastBeatIntervalMs
}
export function getHairspringActiveLengthMm(): f64 {
  return (HAIRSPRING_L0 - regulatorMicrons * 1.0e-6) * 1000.0
}
