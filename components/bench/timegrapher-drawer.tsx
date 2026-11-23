"use client"

import { useEffect } from "react"
import { FastForward, Magnet, RotateCcw, Wind, X } from "lucide-react"
import {
  evaluate6497Health,
  WATCH_POSITIONS,
  type HorologySnapshot,
  type TimegrapherDot,
  type WatchPosition,
} from "@/lib/horology/physics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function TimegrapherDrawer({
  open,
  onOpenChange,
  snapshot,
  dots,
  position,
  onSelectPosition,
  regulatorMicrons,
  onChangeRegulatorMicrons,
  colletOffsetDeg,
  onChangeColletOffsetDeg,
  onWindFull,
  onSkipTwoWeeks,
  daysElapsed,
  magnetized,
  onDemagnetize,
  onClearTrace,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: HorologySnapshot
  dots: TimegrapherDot[]
  position: WatchPosition
  onSelectPosition: (pos: WatchPosition) => void
  regulatorMicrons: number
  onChangeRegulatorMicrons: (microns: number) => void
  colletOffsetDeg: number
  onChangeColletOffsetDeg: (deg: number) => void
  onWindFull: () => void
  onSkipTwoWeeks: () => void
  daysElapsed: number
  magnetized: number
  onDemagnetize: () => void
  onClearTrace: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const health = evaluate6497Health(snapshot, position)
  const rateFormatted = `${snapshot.rateSecPerDay >= 0 ? "+" : ""}${snapshot.rateSecPerDay.toFixed(1)} s/d`

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Witschi Chronoscope acoustic timegrapher strip"
      className="fixed inset-x-0 bottom-0 z-40 max-h-[46dvh] overflow-y-auto overscroll-contain border-t border-border bg-card px-3 py-3 text-card-foreground shadow-lg sm:px-5"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        {/* Top instrument header + Three unwrapped blued-steel telemetry numbers + positions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
          <div className="flex flex-wrap items-baseline gap-4">
            <div>
              <span className="text-xs font-semibold text-foreground">
                Witschi Acoustic Ribbon
              </span>
              <span className="ml-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                44.0° lift, 18,000 vph, Day {Math.round(daysElapsed)}
              </span>
            </div>

            <div className="flex items-baseline gap-5 font-mono tabular-nums">
              <div className="whitespace-nowrap">
                <span className="mr-1.5 font-sans text-[11px] text-muted-foreground">
                  Rate
                </span>
                <span className="text-base font-semibold text-[var(--blued-steel)] sm:text-lg">
                  {rateFormatted}
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="mr-1.5 font-sans text-[11px] text-muted-foreground">
                  Amp ({position})
                </span>
                <span className="text-base font-semibold text-[var(--blued-steel)] sm:text-lg">
                  {snapshot.amplitudeDeg.toFixed(0)}°
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="mr-1.5 font-sans text-[11px] text-muted-foreground">
                  Beat
                </span>
                <span className="text-base font-semibold text-[var(--blued-steel)] sm:text-lg">
                  {snapshot.beatErrorMs.toFixed(2)} ms
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant={health.healthy ? "secondary" : "outline"}>
              {health.healthy
                ? "Within 6497-1 Pass Band"
                : `Target ±5 s/d, ${health.minAmp}°–${health.maxAmp}°`}
            </Badge>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close timegrapher strip"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Middle row: Scrolling Acoustic Dot Ribbon + Right Regulation Controls */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <svg
              viewBox="0 0 640 108"
              role="img"
              aria-label={`Live timegrapher acoustic trace showing rate ${rateFormatted}, amplitude ${snapshot.amplitudeDeg.toFixed(0)} degrees, beat error ${snapshot.beatErrorMs.toFixed(2)} milliseconds`}
              className="h-24 w-full rounded-lg border border-border bg-background"
            >
              {[20, 37, 54, 71, 88].map((y) => (
                <line
                  key={y}
                  x1={0}
                  y1={y}
                  x2={640}
                  y2={y}
                  stroke="currentColor"
                  className={
                    y === 54 ? "text-[var(--blued-steel)]/40" : "text-border"
                  }
                  strokeDasharray={y === 54 ? "none" : "3 4"}
                  strokeWidth={y === 54 ? 1.1 : 0.75}
                />
              ))}

              {dots.map((dot, idx) => {
                const x = 14 + (idx / 150) * 612
                const y = Math.max(
                  8,
                  Math.min(100, 54 - dot.phaseOffsetMs * 2.6)
                )
                return (
                  <circle
                    key={dot.id}
                    cx={x}
                    cy={y}
                    r={dot.isTick ? 2.1 : 1.85}
                    className={
                      dot.isTick
                        ? "fill-[var(--blued-steel)]"
                        : "fill-primary"
                    }
                  />
                )
              })}
            </svg>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Regulator (− / +)
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <span className="font-mono">
                    {regulatorMicrons >= 0 ? "+" : ""}
                    {regulatorMicrons.toFixed(0)}
                  </span>{" "}
                  µm
                </span>
              </div>
              <Slider
                aria-label="Regulator index active hairspring length"
                min={-220}
                max={220}
                step={2}
                value={[regulatorMicrons]}
                onValueChange={(val) => {
                  const next = Array.isArray(val) ? val[0] : val
                  onChangeRegulatorMicrons(Number(next))
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Stud / Beat Collet
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {colletOffsetDeg >= 0 ? "+" : ""}
                  {colletOffsetDeg.toFixed(2)}°
                </span>
              </div>
              <Slider
                aria-label="Stud carrier beat error alignment"
                min={-3.0}
                max={3.0}
                step={0.05}
                value={[colletOffsetDeg]}
                onValueChange={(val) => {
                  const next = Array.isArray(val) ? val[0] : val
                  onChangeColletOffsetDeg(Number(next))
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
              <div
                role="group"
                aria-label="Six watch testing positions"
                className="flex flex-wrap gap-1"
              >
                {WATCH_POSITIONS.map((p) => (
                  <Button
                    key={p.code}
                    variant="ghost"
                    size="xs"
                    onClick={() => onSelectPosition(p.code)}
                    title={`${p.label}: ${p.orientationNote}`}
                    className={cn(
                      "font-mono",
                      position === p.code
                        ? "bg-secondary text-foreground ring-1 ring-primary/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {p.code}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="ghost" size="xs" onClick={onClearTrace}>
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Clear
                </Button>
                <Button variant="outline" size="xs" onClick={onWindFull}>
                  <Wind className="size-3" aria-hidden="true" />
                  Wind 46h
                </Button>
                <Button variant="outline" size="xs" onClick={onSkipTwoWeeks}>
                  <FastForward className="size-3" aria-hidden="true" />
                  +14d Check
                </Button>
                {magnetized > 0.05 ? (
                  <Button variant="secondary" size="xs" onClick={onDemagnetize}>
                    <Magnet className="size-3 text-primary" aria-hidden="true" />
                    Demagnetize
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
