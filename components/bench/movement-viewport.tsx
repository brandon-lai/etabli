"use client"

import React, {
  Component,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import * as THREE from "three"
import { getPartById, type MovementSide } from "@/lib/horology/caliber6497"
import {
  render2dMacroFallback,
  type FallbackHitRegion,
} from "@/lib/horology/canvas2d-fallback"
import { stampShareCardCanvas } from "@/lib/horology/material-palette"
import type { HorologySnapshot } from "@/lib/horology/physics"
import {
  buildMovementScene,
  type MovementSceneController,
} from "@/lib/horology/scene-builder"

export type LoupePreset = "bench" | "loupe4x" | "escapement10x"

export interface MovementViewportHandle {
  captureShareCardPng(meta: {
    title: string
    rateText: string
    amplitudeText: string
    beatErrorText: string
    positionCode: string
  }): string | null
}

interface MovementViewportProps {
  readLiveSnapshot: () => HorologySnapshot
  installedParts: ReadonlySet<string>
  selectedPartId: string | null
  guidedPartId: string | null
  onSelectPart: (partId: string, pressure: number, pointerType: string) => void
  explodeAmount: number
  side: MovementSide
  loupePreset: LoupePreset
  overOiled: number
  oilQuality: number
  slowOrbit?: boolean
  interactiveLabel?: string
  onReady?: (handle: MovementViewportHandle | null) => void
}

function detectWebGLSupport(): boolean {
  if (typeof document === "undefined") return false
  try {
    const probe = document.createElement("canvas")
    const gl =
      probe.getContext("webgl2") ||
      probe.getContext("webgl") ||
      probe.getContext("experimental-webgl")
    return Boolean(gl)
  } catch {
    return false
  }
}

class ViewportErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function FallbackCanvas2D({
  readLiveSnapshot,
  installedParts,
  selectedPartId,
  guidedPartId,
  onSelectPart,
  explodeAmount,
  side,
  loupePreset,
  canvasForwardRef,
}: MovementViewportProps & {
  canvasForwardRef: React.MutableRefObject<HTMLCanvasElement | null>
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const hitsRef = useRef<FallbackHitRegion[]>([])
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null)
  const [dims, setDims] = useState({ w: 800, h: 520 })

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setDims({ w: Math.round(rect.width), h: Math.round(rect.height) })
    }
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr && cr.width > 0 && cr.height > 0) {
        setDims({ w: Math.round(cr.width), h: Math.round(cr.height) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const draw = () => {
      const canvas = localCanvasRef.current
      if (canvas) {
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const cw = Math.max(1, Math.floor(dims.w * dpr))
        const ch = Math.max(1, Math.floor(dims.h * dpr))
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw
          canvas.height = ch
        }
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.save()
          ctx.scale(dpr, dpr)
          const zoom =
            loupePreset === "escapement10x"
              ? 1.65
              : loupePreset === "loupe4x"
                ? 1.25
                : 1.0
          hitsRef.current = render2dMacroFallback(
            ctx,
            dims.w,
            dims.h,
            readLiveSnapshot(),
            {
              installedParts,
              selectedPartId,
              hoveredPartId,
              guidedPartId,
              explodeAmount,
              side,
              zoom,
            }
          )
          ctx.restore()
        }
      }
      raf = window.requestAnimationFrame(draw)
    }
    raf = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(raf)
  }, [
    dims,
    explodeAmount,
    guidedPartId,
    hoveredPartId,
    installedParts,
    loupePreset,
    readLiveSnapshot,
    selectedPartId,
    side,
  ])

  const pickAt = (clientX: number, clientY: number): string | null => {
    const canvas = localCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    for (let i = hitsRef.current.length - 1; i >= 0; i--) {
      const h = hitsRef.current[i]
      const dist = Math.hypot(x - h.cx, y - h.cy)
      if (dist <= h.r) return h.partId
    }
    return null
  }

  const hoveredSpec = hoveredPartId ? getPartById(hoveredPartId) : null

  return (
    <div ref={wrapRef} className="relative h-full w-full select-none overflow-hidden">
      <canvas
        ref={(node) => {
          localCanvasRef.current = node
          canvasForwardRef.current = node
        }}
        className="block h-full w-full cursor-crosshair touch-none"
        aria-label="Unitas 6497-1 technical movement bench canvas"
        onPointerMove={(e) => {
          setHoveredPartId(pickAt(e.clientX, e.clientY))
        }}
        onPointerDown={(e) => {
          const hit = pickAt(e.clientX, e.clientY)
          if (hit) {
            onSelectPart(
              hit,
              e.pressure > 0 ? e.pressure : 0.5,
              e.pointerType || "mouse"
            )
          }
        }}
      />
      {hoveredSpec ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-popover/90 px-3 py-1.5 text-xs text-popover-foreground backdrop-blur-sm">
          <span className="font-medium">{hoveredSpec.name}</span>
          <span className="ml-2 font-mono text-muted-foreground">
            {hoveredSpec.etaNumber}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export const MovementViewport = forwardRef<
  MovementViewportHandle,
  MovementViewportProps
>(function MovementViewport(props, ref) {
  const {
    readLiveSnapshot,
    installedParts,
    selectedPartId,
    guidedPartId,
    onSelectPart,
    explodeAmount,
    side,
    loupePreset,
    overOiled,
    oilQuality,
    slowOrbit = false,
    interactiveLabel = "Interactive 3D Unitas 6497-1 watch movement on bench mat",
  } = props

  const containerRef = useRef<HTMLDivElement | null>(null)
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controllerRef = useRef<MovementSceneController | null>(null)

  const [use3D, setUse3D] = useState<boolean>(true)
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null)
  const [stylusPressure, setStylusPressure] = useState<number | null>(null)

  const orbitRef = useRef({
    azimuth: 0.0,
    polar: 0.48,
    distance: 26.8,
    aspectZoomOut: 1.0,
    targetX: 0.5,
    targetY: 0.0,
    dragging: false,
    movedPx: 0,
    downX: 0,
    downY: 0,
  })

  const livePropsRef = useRef({
    installedParts,
    selectedPartId,
    hoveredPartId,
    guidedPartId,
    explodeAmount,
    side,
    loupePreset,
    overOiled,
    oilQuality,
    slowOrbit,
  })
  livePropsRef.current = {
    installedParts,
    selectedPartId,
    hoveredPartId,
    guidedPartId,
    explodeAmount,
    side,
    loupePreset,
    overOiled,
    oilQuality,
    slowOrbit,
  }

  useEffect(() => {
    const orb = orbitRef.current
    if (loupePreset === "escapement10x") {
      orb.distance = 11.4
      orb.targetX = side === "dial" ? -3.2 : 3.6
      orb.targetY = -2.4
      orb.polar = 0.28
    } else if (loupePreset === "loupe4x") {
      orb.distance = 16.8
      orb.targetX = 0.4
      orb.targetY = 0
      orb.polar = 0.36
    } else {
      orb.distance = 26.8
      // Slight +0.55 X center accounts for the 3 o'clock onion crown so both bezel & crown sit balanced
      orb.targetX = side === "dial" ? -0.55 : 0.55
      orb.targetY = 0
      orb.polar = 0.48
    }
  }, [loupePreset, side])

  useLayoutEffect(() => {
    if (!detectWebGLSupport()) {
      setUse3D(false)
      return
    }
    const container = containerRef.current
    const canvas = glCanvasRef.current
    if (!container || !canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      })
    } catch {
      setUse3D(false)
      return
    }

    activeCanvasRef.current = canvas
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    const controller = buildMovementScene(renderer)
    controllerRef.current = controller

    const applySize = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      const aspect = w / h
      controller.camera.aspect = aspect
      // Scale distance smoothly on narrow/portrait viewports so 36.6mm mainplate + 3H crown never clip
      orbitRef.current.aspectZoomOut =
        aspect < 1.15 ? Math.min(1.82, 1.15 / Math.max(0.42, aspect)) : 1.0
      controller.camera.updateProjectionMatrix()
    }

    const initRect = container.getBoundingClientRect()
    applySize(initRect.width || 800, initRect.height || 520)

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) applySize(cr.width, cr.height)
    })
    ro.observe(container)

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    let rafId = 0
    const renderLoop = () => {
      const p = livePropsRef.current
      const orb = orbitRef.current
      const cam = controller.camera

      if (p.slowOrbit && !orb.dragging && !reducedMotionQuery.matches) {
        orb.azimuth += 0.0014
      }

      const effectiveDist = orb.distance * orb.aspectZoomOut
      const sinP = Math.sin(orb.polar)
      const cosP = Math.cos(orb.polar)
      cam.position.set(
        orb.targetX + effectiveDist * sinP * Math.sin(orb.azimuth),
        orb.targetY - effectiveDist * sinP * Math.cos(orb.azimuth),
        effectiveDist * cosP
      )
      cam.lookAt(orb.targetX, orb.targetY, 0)

      controller.updateFrame(readLiveSnapshot(), {
        installedParts: p.installedParts,
        selectedPartId: p.selectedPartId,
        hoveredPartId: p.hoveredPartId,
        guidedPartId: p.guidedPartId,
        explodeAmount: p.explodeAmount,
        side: p.side,
        overOiled: p.overOiled,
        oilQuality: p.oilQuality,
      })

      renderer.render(controller.scene, cam)
      rafId = window.requestAnimationFrame(renderLoop)
    }
    rafId = window.requestAnimationFrame(renderLoop)

    return () => {
      window.cancelAnimationFrame(rafId)
      ro.disconnect()
      controller.dispose()
      renderer.dispose()
      rendererRef.current = null
      controllerRef.current = null
    }
  }, [readLiveSnapshot])

  const captureHandle = React.useMemo<MovementViewportHandle>(
    () => ({
      captureShareCardPng(meta) {
        const srcCanvas = activeCanvasRef.current || glCanvasRef.current
        if (!srcCanvas) return null
        return stampShareCardCanvas(srcCanvas, meta)
      },
    }),
    []
  )

  useImperativeHandle(ref, () => captureHandle, [captureHandle])

  useEffect(() => {
    props.onReady?.(captureHandle)
    return () => props.onReady?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureHandle])

  const raycastPart = (clientX: number, clientY: number): string | null => {
    const canvas = glCanvasRef.current
    const controller = controllerRef.current
    if (!canvas || !controller) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null

    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(ndc, controller.camera)
    const visibleTargets = controller.pickMeshes.filter((m) => {
      let cur: THREE.Object3D | null = m
      while (cur) {
        if (!cur.visible) return false
        cur = cur.parent
      }
      return true
    })
    const hits = raycaster.intersectObjects(visibleTargets, false)
    for (const h of hits) {
      const pid = h.object.userData?.partId as string | undefined
      if (pid) return pid
    }
    return null
  }

  if (!use3D) {
    return <FallbackCanvas2D {...props} canvasForwardRef={activeCanvasRef} />
  }

  const hoveredSpec = hoveredPartId ? getPartById(hoveredPartId) : null

  return (
    <ViewportErrorBoundary
      fallback={<FallbackCanvas2D {...props} canvasForwardRef={activeCanvasRef} />}
    >
      <div
        ref={containerRef}
        className="relative h-full w-full select-none overflow-hidden"
      >
        <canvas
          ref={glCanvasRef}
          aria-label={interactiveLabel}
          className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(e) => {
            const orb = orbitRef.current
            orb.dragging = true
            orb.movedPx = 0
            orb.downX = e.clientX
            orb.downY = e.clientY
            if (e.pointerType === "pen") {
              setStylusPressure(e.pressure)
            }
            try {
              e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
              // Synthetic CDP events may not hold active pointer capture
            }
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "pen" && e.buttons > 0) {
              setStylusPressure(e.pressure)
            }
            const orb = orbitRef.current
            if (orb.dragging) {
              const dx = e.clientX - orb.downX
              const dy = e.clientY - orb.downY
              orb.downX = e.clientX
              orb.downY = e.clientY
              orb.movedPx += Math.hypot(dx, dy)
              orb.azimuth -= dx * 0.0075
              orb.polar = Math.max(0.08, Math.min(1.28, orb.polar - dy * 0.0065))
            } else {
              setHoveredPartId(raycastPart(e.clientX, e.clientY))
            }
          }}
          onPointerUp={(e) => {
            const orb = orbitRef.current
            const wasClick = orb.movedPx < 6
            orb.dragging = false
            setStylusPressure(null)
            try {
              e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {
              // Ignore if not captured
            }
            if (wasClick) {
              const hit = raycastPart(e.clientX, e.clientY)
              if (hit) {
                onSelectPart(
                  hit,
                  e.pressure > 0 ? e.pressure : 0.5,
                  e.pointerType || "mouse"
                )
              }
            }
          }}
          onWheel={(e) => {
            const orb = orbitRef.current
            orb.distance = Math.max(
              8.5,
              Math.min(34.0, orb.distance + e.deltaY * 0.014)
            )
          }}
        />

        {/* Subtle optical loupe field vignette when zoomed to 4x or 10x */}
        {loupePreset !== "bench" ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, transparent 56%, var(--scrim) 100%)",
            }}
          />
        ) : null}

        {hoveredSpec ? (
          <div className="pointer-events-none absolute bottom-14 left-4 flex items-center gap-2 rounded-lg border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground">
            <span className="font-medium">{hoveredSpec.name}</span>
            <span className="font-mono text-muted-foreground">
              {hoveredSpec.etaNumber}
            </span>
          </div>
        ) : null}

        {stylusPressure !== null ? (
          <div className="pointer-events-none absolute top-3 right-3 rounded-md border border-border bg-popover px-2.5 py-1 text-xs tabular-nums text-popover-foreground">
            Pencil force{" "}
            <span className="font-mono">
              {(stylusPressure * 100).toFixed(0)}%
            </span>
          </div>
        ) : null}
      </div>
    </ViewportErrorBoundary>
  )
})
