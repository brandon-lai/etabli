"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Activity, Eye, FlipHorizontal, Gauge, Layers, PanelRight } from "lucide-react"
import {
  ALL_INSTALLED_PART_IDS,
  CALIBER_6497_PARTS,
  getPartById,
  LUBRICANTS,
  TOTAL_6497_JEWELS,
  type MovementSide,
} from "@/lib/horology/caliber6497"
import {
  ARRIVAL_GUMMED_CONDITIONS,
  CLEAN_SERVICE_CONDITIONS,
  type ServiceConditionState,
} from "@/lib/horology/physics"
import { useHorologySimBridge } from "@/lib/horology/use-sim-bridge"
import type { LoupePreset } from "@/components/bench/movement-viewport"
import { TimegrapherDrawer } from "@/components/bench/timegrapher-drawer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const MovementViewport = dynamic(
  () =>
    import("@/components/bench/movement-viewport").then(
      (m) => m.MovementViewport
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bench-mat)] text-sm text-muted-foreground">
        Loading Calibre 6497-1 anatomical assembly…
      </div>
    ),
  }
)

type FaultPreset = "clean" | "gummed" | "magnetized" | "overoiled14d"

export function ExploreView() {
  const installedSet = useMemo(() => new Set(ALL_INSTALLED_PART_IDS), [])
  const [selectedPartId, setSelectedPartId] = useState<string>("balance_assembly")
  const [explodeAmount, setExplodeAmount] = useState<number>(0.32)
  const [side, setSide] = useState<MovementSide>("movement")
  const [loupePreset, setLoupePreset] = useState<LoupePreset>("bench")
  const [faultPreset, setFaultPreset] = useState<FaultPreset>("clean")
  const [conditions, setConditions] = useState<ServiceConditionState>(
    CLEAN_SERVICE_CONDITIONS
  )
  const [regulatorMicrons, setRegulatorMicrons] = useState(0)
  const [colletOffsetDeg, setColletOffsetDeg] = useState(0)
  const [timegrapherOpen, setTimegrapherOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)

  const sim = useHorologySimBridge({
    initialPosition: "DU",
    initialWind: 1.0,
    initialConditions: CLEAN_SERVICE_CONDITIONS,
  })

  const applyFaultPreset = (preset: FaultPreset) => {
    setFaultPreset(preset)
    let next: ServiceConditionState = CLEAN_SERVICE_CONDITIONS
    if (preset === "gummed") {
      next = ARRIVAL_GUMMED_CONDITIONS
    } else if (preset === "magnetized") {
      next = {
        ...CLEAN_SERVICE_CONDITIONS,
        magnetizedFactor: 0.9,
      }
    } else if (preset === "overoiled14d") {
      next = {
        ...CLEAN_SERVICE_CONDITIONS,
        overOiledFactor: 1.0,
        daysElapsed: 14,
      }
    }
    setConditions(next)
    sim.setServiceConditions(next, true)
  }

  const selectedSpec =
    getPartById(selectedPartId) ?? CALIBER_6497_PARTS[0]

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--bench-mat)] text-foreground">
      <SiteHeader floating />

      {/* Full-bleed live 3D exploded Unitas 6497-1 viewport */}
      <main className="relative h-full w-full">
        <MovementViewport
          readLiveSnapshot={sim.readLiveSnapshot}
          installedParts={installedSet}
          selectedPartId={selectedPartId}
          guidedPartId={null}
          onSelectPart={(pid) => {
            setSelectedPartId(pid)
            setSheetOpen(true)
          }}
          explodeAmount={explodeAmount}
          side={side}
          loupePreset={loupePreset}
          overOiled={conditions.overOiledFactor}
          oilQuality={conditions.trainOilQuality}
        />

        {/* Top-left caliber header + single primary CTA */}
        <section
          aria-label="Caliber anatomy header"
          className="pointer-events-none absolute top-16 left-3 right-3 z-20 flex flex-wrap items-start justify-between gap-2 sm:left-5 sm:right-5"
        >
          <div className="pointer-events-auto rounded-xl border border-border bg-card px-3.5 py-2.5">
            <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Calibre ETA / Unitas 6497-1 Anatomy
            </h1>
            <p className="text-xs text-muted-foreground">
              36.60 mm (16½ lignes), 18,000 vph, {TOTAL_6497_JEWELS} synthetic
              rubies, 44° lift angle
            </p>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSide((s) => (s === "movement" ? "dial" : "movement"))
              }
            >
              <FlipHorizontal className="size-3.5" aria-hidden="true" />
              {side === "movement" ? "Bridge Side" : "Dial Side"}
            </Button>

            {(
              [
                ["bench", "1×"],
                ["loupe4x", "4×"],
                ["escapement10x", "10×"],
              ] as const
            ).map(([preset, label]) => (
              <Button
                key={preset}
                variant="ghost"
                size="sm"
                className={cn(
                  loupePreset === preset &&
                    "bg-secondary text-foreground ring-1 ring-primary/60"
                )}
                onClick={() => setLoupePreset(preset)}
              >
                <Eye className="size-3.5" aria-hidden="true" />
                {label}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                sim.timeScale < 0.2 &&
                  "bg-secondary text-foreground ring-1 ring-primary/60"
              )}
              onClick={() => sim.setTimeScale(sim.timeScale < 0.2 ? 1.0 : 0.03)}
            >
              <Gauge className="size-3.5" aria-hidden="true" />
              {sim.timeScale < 0.2 ? "0.03× Study" : "1× Speed"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimegrapherOpen((o) => !o)}
            >
              <Activity
                className="size-3.5 text-[var(--blued-steel)]"
                aria-hidden="true"
              />
              <span className="font-mono tabular-nums">
                {sim.uiSnapshot.amplitudeDeg.toFixed(0)}°,{" "}
                {sim.uiSnapshot.rateSecPerDay >= 0 ? "+" : ""}
                {sim.uiSnapshot.rateSecPerDay.toFixed(1)} s/d
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle assembly technical sheet"
              onClick={() => setSheetOpen((o) => !o)}
            >
              <PanelRight className="size-4" aria-hidden="true" />
            </Button>

            <Button size="sm" nativeButton={false} render={<Link href="/bench" />}>
              Service on Bench
            </Button>
          </div>
        </section>

        {/* Collapsible Right-Edge Flat Technical Sheet (zero nested cards) */}
        {sheetOpen && !timegrapherOpen ? (
          <aside
            aria-label="Selected component technical sheet"
            className="absolute top-36 right-3 z-20 hidden max-h-[calc(100dvh-13.5rem)] w-80 flex-col overflow-hidden rounded-xl border border-border bg-card sm:right-5 lg:flex"
          >
            <div className="border-b border-border p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-primary">
                  {selectedSpec.etaNumber}
                </span>
                <Badge variant="outline">{selectedSpec.jewelCount} rubies</Badge>
              </div>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {selectedSpec.name}
              </h2>
              <p className="text-xs italic text-muted-foreground">
                {selectedSpec.frenchTerm}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {selectedSpec.plainFunction}
              </p>
              <dl className="mt-2.5 divide-y divide-border border-t border-border text-xs">
                <div className="flex justify-between gap-2 py-1.5">
                  <dt className="text-muted-foreground">Alloy</dt>
                  <dd className="text-right font-medium text-foreground">
                    {selectedSpec.material}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 py-1.5">
                  <dt className="text-muted-foreground">Lubricant</dt>
                  <dd className="text-right font-medium text-foreground">
                    {LUBRICANTS.find(
                      (l) => l.id === selectedSpec.requiredLubricant
                    )?.name ?? "Strictly dry"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="divide-y divide-border overflow-y-auto overscroll-contain">
              {CALIBER_6497_PARTS.filter((p) => p.id !== "mainspring_power").map(
                (part) => {
                  const active = part.id === selectedSpec.id
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => {
                        setSelectedPartId(part.id)
                        setSide(part.side)
                      }}
                      className={cn(
                        "flex min-h-10 w-full items-center justify-between gap-2 px-3.5 py-1.5 text-left text-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                        active
                          ? "bg-secondary font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{part.name}</span>
                      <span className="shrink-0 font-mono text-[11px]">
                        {part.jewelCount > 0 ? `${part.jewelCount}J ` : ""}
                        {part.side === "dial" ? "Dial" : "Bridge"}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          </aside>
        ) : null}

        {/* Bottom Exploded Stack & Physics Condition Strip */}
        {!timegrapherOpen ? (
          <section
            aria-label="Axial stack and condition controls"
            className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-border bg-card px-3.5 py-2.5 sm:inset-x-5"
          >
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Layers
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium whitespace-nowrap text-foreground">
                  Axial Stack
                </span>
                <Slider
                  aria-label="Exploded view separation"
                  min={0}
                  max={100}
                  step={2}
                  value={[Math.round(explodeAmount * 100)]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val
                    setExplodeAmount(Number(v) / 100)
                  }}
                  className="max-w-48"
                />
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round(explodeAmount * 100)}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">
                  Condition:
                </span>
                {(
                  [
                    ["clean", "Fresh Service"],
                    ["gummed", "12y Gummed Oil"],
                    ["magnetized", "Magnetized Coils"],
                    ["overoiled14d", "Over-Oiled (+14d)"],
                  ] as const
                ).map(([preset, label]) => (
                  <Button
                    key={preset}
                    size="xs"
                    variant="ghost"
                    className={cn(
                      faultPreset === preset
                        ? "bg-secondary text-foreground ring-1 ring-primary/60"
                        : "text-muted-foreground"
                    )}
                    onClick={() => applyFaultPreset(preset)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <TimegrapherDrawer
        open={timegrapherOpen}
        onOpenChange={setTimegrapherOpen}
        snapshot={sim.uiSnapshot}
        dots={sim.dots}
        position={sim.position}
        onSelectPosition={sim.setPosition}
        regulatorMicrons={regulatorMicrons}
        onChangeRegulatorMicrons={(m) => {
          setRegulatorMicrons(m)
          sim.setRegulatorMicrons(m)
        }}
        colletOffsetDeg={colletOffsetDeg}
        onChangeColletOffsetDeg={(d) => {
          setColletOffsetDeg(d)
          sim.setColletOffsetDeg(d)
        }}
        onWindFull={() => sim.setWindFraction(1.0)}
        onSkipTwoWeeks={() => {
          const next = { ...conditions, daysElapsed: conditions.daysElapsed + 14 }
          setConditions(next)
          sim.setServiceConditions(next, true)
        }}
        daysElapsed={conditions.daysElapsed}
        magnetized={conditions.magnetizedFactor}
        onDemagnetize={() => applyFaultPreset("clean")}
        onClearTrace={sim.clearTrace}
      />
    </div>
  )
}
