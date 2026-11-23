// Dedicated Web Worker running public/wasm/horology.wasm at 10 kHz fixed step.
// Uses SharedArrayBuffer zero-copy Float64 telemetry when crossOriginIsolated,
// and emits acoustic beat events + fallback telemetry frames over postMessage.

const SAB_SLOTS = {
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
}

let wasm = null
let sharedF64 = null
let sharedI32 = null
let running = true
let timeScale = 1.0
let stepCarry = 0.0
let lastTickMs = performance.now()
let cumulativePhaseOffsetMs = 0.0

function syncTelemetry(eventFlags) {
  if (!wasm) return
  if (sharedF64) {
    sharedF64[SAB_SLOTS.SIM_TIME] = wasm.getSimTimeSec()
    sharedF64[SAB_SLOTS.BALANCE_ANGLE] = wasm.getBalanceAngleRad()
    sharedF64[SAB_SLOTS.BALANCE_OMEGA] = wasm.getBalanceOmega()
    sharedF64[SAB_SLOTS.PALLET_ANGLE] = wasm.getPalletAngleRad()
    sharedF64[SAB_SLOTS.ESCAPE_ANGLE] = wasm.getEscapeWheelAngleRad()
    sharedF64[SAB_SLOTS.FOURTH_ANGLE] = wasm.getFourthWheelAngleRad()
    sharedF64[SAB_SLOTS.THIRD_ANGLE] = wasm.getThirdWheelAngleRad()
    sharedF64[SAB_SLOTS.CENTER_ANGLE] = wasm.getCenterWheelAngleRad()
    sharedF64[SAB_SLOTS.BARREL_ANGLE] = wasm.getBarrelAngleRad()
    sharedF64[SAB_SLOTS.WIND_FRACTION] = wasm.getWindFraction()
    sharedF64[SAB_SLOTS.AMPLITUDE_DEG] = wasm.getAmplitudeDeg()
    sharedF64[SAB_SLOTS.RATE_SEC_DAY] = wasm.getRateSecPerDay()
    sharedF64[SAB_SLOTS.BEAT_ERROR_MS] = wasm.getBeatErrorMs()
    sharedF64[SAB_SLOTS.BEAT_COUNT] = wasm.getBeatCount()
    sharedF64[SAB_SLOTS.LAST_BEAT_MS] = wasm.getLastBeatIntervalMs()
    sharedF64[SAB_SLOTS.HAIRSPRING_MM] = wasm.getHairspringActiveLengthMm()
    if (sharedI32) {
      Atomics.add(sharedI32, 0, 1)
    }
  } else {
    self.postMessage({
      type: "telemetry",
      snapshot: {
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
      },
    })
  }
}

async function bootWasm(sab) {
  if (sab) {
    sharedF64 = new Float64Array(sab, 0, 16)
    sharedI32 = new Int32Array(sab, 128, 4)
  }
  const res = await fetch("/wasm/horology.wasm")
  const bytes = await res.arrayBuffer()
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: { abort() {} },
  })
  wasm = instance.exports
  wasm.setAssemblyState(1, 1, 1)
  wasm.setPosition(0)
  wasm.setWindFraction(1.0)
  wasm.setServiceConditions(1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0)
  wasm.resetSimulation(1)
  wasm.stepBatch(12000)
  syncTelemetry(0)
  lastTickMs = performance.now()
  self.postMessage({ type: "ready", sharedMemory: Boolean(sharedF64) })
}

function tickLoop() {
  const now = performance.now()
  const elapsedSec = Math.min(0.05, Math.max(0.001, (now - lastTickMs) / 1000))
  lastTickMs = now

  if (wasm && running) {
    const exactSteps = elapsedSec * 10000.0 * timeScale + stepCarry
    const wholeSteps = Math.floor(exactSteps)
    stepCarry = exactSteps - wholeSteps

    if (wholeSteps > 0) {
      let remaining = wholeSteps
      let aggregatedEvents = 0
      const prevBeatCount = wasm.getBeatCount()
      while (remaining > 0) {
        const chunk = remaining > 200 ? 200 : remaining
        aggregatedEvents |= wasm.stepBatch(chunk)
        remaining -= chunk
      }
      const newBeatCount = wasm.getBeatCount()
      if (aggregatedEvents !== 0 || newBeatCount !== prevBeatCount) {
        const beatIntervalMs = wasm.getLastBeatIntervalMs()
        const rate = wasm.getRateSecPerDay()
        const beatErr = wasm.getBeatErrorMs()
        const isTick = newBeatCount % 2 === 0
        cumulativePhaseOffsetMs += (rate / 86400.0) * 200.0
        if (cumulativePhaseOffsetMs > 18) cumulativePhaseOffsetMs -= 36
        if (cumulativePhaseOffsetMs < -18) cumulativePhaseOffsetMs += 36
        const dotPhaseMs =
          cumulativePhaseOffsetMs + (isTick ? beatErr : -beatErr)

        self.postMessage({
          type: "beat",
          events: aggregatedEvents,
          beatCount: newBeatCount,
          simTimeSec: wasm.getSimTimeSec(),
          amplitudeDeg: wasm.getAmplitudeDeg(),
          rateSecPerDay: rate,
          beatErrorMs: beatErr,
          beatIntervalMs,
          phaseOffsetMs: dotPhaseMs,
          isTick,
        })
      }
      syncTelemetry(aggregatedEvents)
    }
  }
}

setInterval(tickLoop, 16)

self.onmessage = (ev) => {
  const msg = ev.data
  if (!msg || typeof msg !== "object") return

  switch (msg.type) {
    case "init":
      bootWasm(msg.sab || null).catch((err) => {
        self.postMessage({ type: "error", message: String(err) })
      })
      break
    case "setRunning":
      running = Boolean(msg.running)
      lastTickMs = performance.now()
      break
    case "setTimeScale":
      timeScale = Math.max(0.01, Math.min(4.0, Number(msg.timeScale) || 1.0))
      break
    case "setPosition":
      if (wasm) {
        wasm.setPosition(Number(msg.position) || 0)
        syncTelemetry(0)
      }
      break
    case "setWindFraction":
      if (wasm) {
        wasm.setWindFraction(Number(msg.windFraction))
        syncTelemetry(0)
      }
      break
    case "setRegulatorMicrons":
      if (wasm) {
        wasm.setRegulatorMicrons(Number(msg.microns) || 0)
        syncTelemetry(0)
      }
      break
    case "setColletOffsetDeg":
      if (wasm) {
        wasm.setColletOffsetDeg(Number(msg.deg) || 0)
        syncTelemetry(0)
      }
      break
    case "setAssemblyState":
      if (wasm) {
        wasm.setAssemblyState(
          msg.oscillatorReady ? 1 : 0,
          msg.escapementReady ? 1 : 0,
          msg.trainReady ? 1 : 0
        )
        syncTelemetry(0)
      }
      break
    case "setServiceConditions":
      if (wasm && msg.conditions) {
        const c = msg.conditions
        wasm.setServiceConditions(
          c.trainOilQuality,
          c.palletOilQuality,
          c.balanceOilQuality,
          c.overOiledFactor,
          c.escapementTeethOiled,
          c.magnetizedFactor,
          c.bentPivotFactor,
          c.daysElapsed
        )
        if (msg.fastSettle && running) {
          wasm.stepBatch(24000)
        }
        syncTelemetry(0)
      }
      break
    case "puffBlower":
      if (wasm) {
        wasm.giveBalanceImpulse(42.0)
        syncTelemetry(0)
      }
      break
    case "reset":
      if (wasm) {
        cumulativePhaseOffsetMs = 0.0
        wasm.resetSimulation(msg.kickStart ? 1 : 0)
        if (msg.kickStart) {
          wasm.stepBatch(8000)
        }
        syncTelemetry(0)
      }
      break
  }
}
