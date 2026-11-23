"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { horologyAudio } from "./audio-engine"
import {
  CLEAN_SERVICE_CONDITIONS,
  positionToIndex,
  readSharedBufferSnapshot,
  type HorologySnapshot,
  type ServiceConditionState,
  type TimegrapherDot,
  type WatchPosition,
} from "./physics"

const INITIAL_SNAPSHOT: HorologySnapshot = {
  simTimeSec: 0,
  balanceAngleRad: 0.25,
  balanceOmega: 68,
  palletAngleRad: 0.08,
  escapeWheelAngleRad: 0,
  fourthWheelAngleRad: 0,
  thirdWheelAngleRad: 0,
  centerWheelAngleRad: 0,
  barrelAngleRad: 0,
  windFraction: 1,
  amplitudeDeg: 292,
  rateSecPerDay: 0.2,
  beatErrorMs: 0.1,
  beatCount: 0,
  lastBeatIntervalMs: 200,
  hairspringActiveLengthMm: 184.32,
  eventFlags: 0,
}

export function useHorologySimBridge(options?: {
  initialPosition?: WatchPosition
  initialWind?: number
  initialConditions?: ServiceConditionState
  initialRegulatorMicrons?: number
  initialColletOffsetDeg?: number
  audioEnabled?: boolean
}) {
  const workerRef = useRef<Worker | null>(null)
  const sharedF64Ref = useRef<Float64Array | null>(null)
  const latestSnapshotRef = useRef<HorologySnapshot>(INITIAL_SNAPSHOT)

  const [ready, setReady] = useState(false)
  const [sharedMemoryActive, setSharedMemoryActive] = useState(false)
  const [uiSnapshot, setUiSnapshot] = useState<HorologySnapshot>(INITIAL_SNAPSHOT)
  const [dots, setDots] = useState<TimegrapherDot[]>([])
  const [running, setRunningState] = useState(true)
  const [timeScale, setTimeScaleState] = useState(1.0)
  const [position, setPositionState] = useState<WatchPosition>(
    options?.initialPosition ?? "DU"
  )

  useEffect(() => {
    let sab: SharedArrayBuffer | null = null
    if (
      typeof window !== "undefined" &&
      window.crossOriginIsolated &&
      typeof SharedArrayBuffer !== "undefined"
    ) {
      sab = new SharedArrayBuffer(256)
      sharedF64Ref.current = new Float64Array(sab, 0, 16)
    }

    const worker = new Worker("/workers/sim-worker.js")
    workerRef.current = worker

    worker.onmessage = (ev: MessageEvent) => {
      const data = ev.data
      if (!data || typeof data !== "object") return

      if (data.type === "ready") {
        setReady(true)
        setSharedMemoryActive(Boolean(data.sharedMemory))
        if (options?.initialPosition) {
          worker.postMessage({
            type: "setPosition",
            position: positionToIndex(options.initialPosition),
          })
        }
        if (typeof options?.initialWind === "number") {
          worker.postMessage({
            type: "setWindFraction",
            windFraction: options.initialWind,
          })
        }
        if (typeof options?.initialRegulatorMicrons === "number") {
          worker.postMessage({
            type: "setRegulatorMicrons",
            microns: options.initialRegulatorMicrons,
          })
        }
        if (typeof options?.initialColletOffsetDeg === "number") {
          worker.postMessage({
            type: "setColletOffsetDeg",
            deg: options.initialColletOffsetDeg,
          })
        }
        if (options?.initialConditions) {
          worker.postMessage({
            type: "setServiceConditions",
            conditions: options.initialConditions,
            fastSettle: true,
          })
        }
      } else if (data.type === "telemetry" && data.snapshot) {
        latestSnapshotRef.current = data.snapshot
      } else if (data.type === "beat") {
        if (options?.audioEnabled !== false) {
          horologyAudio.playEscapementBeat(
            data.events,
            data.amplitudeDeg,
            Boolean(data.isTick)
          )
        }
        setDots((prev) => {
          const nextDot: TimegrapherDot = {
            id: data.beatCount,
            beatIndex: data.beatCount,
            simTimeSec: data.simTimeSec,
            phaseOffsetMs: data.phaseOffsetMs,
            isTick: Boolean(data.isTick),
            amplitudeDeg: data.amplitudeDeg,
            rateSecPerDay: data.rateSecPerDay,
            beatErrorMs: data.beatErrorMs,
          }
          if (prev.length >= 150) {
            return [...prev.slice(prev.length - 149), nextDot]
          }
          return [...prev, nextDot]
        })
      }
    }

    worker.postMessage({ type: "init", sab })

    const uiTimer = window.setInterval(() => {
      if (sharedF64Ref.current) {
        const snap = readSharedBufferSnapshot(sharedF64Ref.current)
        if (snap.simTimeSec > 0 || snap.amplitudeDeg > 0) {
          latestSnapshotRef.current = snap
        }
      }
      setUiSnapshot({ ...latestSnapshotRef.current })
    }, 90)

    return () => {
      window.clearInterval(uiTimer)
      worker.terminate()
      workerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const readLiveSnapshot = useCallback((): HorologySnapshot => {
    if (sharedF64Ref.current) {
      const snap = readSharedBufferSnapshot(sharedF64Ref.current)
      if (snap.simTimeSec > 0 || snap.amplitudeDeg > 0) {
        latestSnapshotRef.current = snap
      }
    }
    return latestSnapshotRef.current
  }, [])

  const setRunning = useCallback((next: boolean) => {
    setRunningState(next)
    workerRef.current?.postMessage({ type: "setRunning", running: next })
  }, [])

  const setTimeScale = useCallback((scale: number) => {
    setTimeScaleState(scale)
    workerRef.current?.postMessage({ type: "setTimeScale", timeScale: scale })
  }, [])

  const setPosition = useCallback((pos: WatchPosition) => {
    setPositionState(pos)
    workerRef.current?.postMessage({
      type: "setPosition",
      position: positionToIndex(pos),
    })
  }, [])

  const setWindFraction = useCallback((windFraction: number) => {
    workerRef.current?.postMessage({ type: "setWindFraction", windFraction })
  }, [])

  const setRegulatorMicrons = useCallback((microns: number) => {
    workerRef.current?.postMessage({ type: "setRegulatorMicrons", microns })
  }, [])

  const setColletOffsetDeg = useCallback((deg: number) => {
    workerRef.current?.postMessage({ type: "setColletOffsetDeg", deg })
  }, [])

  const setAssemblyState = useCallback(
    (oscillatorReady: boolean, escapementReady: boolean, trainReady: boolean) => {
      workerRef.current?.postMessage({
        type: "setAssemblyState",
        oscillatorReady,
        escapementReady,
        trainReady,
      })
    },
    []
  )

  const setServiceConditions = useCallback(
    (conditions: ServiceConditionState, fastSettle = true) => {
      workerRef.current?.postMessage({
        type: "setServiceConditions",
        conditions,
        fastSettle,
      })
    },
    []
  )

  const puffBlower = useCallback(() => {
    workerRef.current?.postMessage({ type: "puffBlower" })
  }, [])

  const clearTrace = useCallback(() => {
    setDots([])
  }, [])

  const resetSimulation = useCallback((kickStart = true) => {
    setDots([])
    workerRef.current?.postMessage({ type: "reset", kickStart })
  }, [])

  return {
    ready,
    sharedMemoryActive,
    uiSnapshot,
    readLiveSnapshot,
    dots,
    running,
    timeScale,
    position,
    setRunning,
    setTimeScale,
    setPosition,
    setWindFraction,
    setRegulatorMicrons,
    setColletOffsetDeg,
    setAssemblyState,
    setServiceConditions,
    puffBlower,
    clearTrace,
    resetSimulation,
    defaultCleanConditions: CLEAN_SERVICE_CONDITIONS,
  }
}
