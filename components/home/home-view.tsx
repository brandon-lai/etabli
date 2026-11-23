"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Volume2, VolumeX } from "lucide-react"
import {
  DEFAULT_DOSSIER_STATE,
  loadBenchDossier,
  type BenchDossierState,
} from "@/lib/bench-storage"
import { horologyAudio } from "@/lib/horology/audio-engine"
import {
  ALL_INSTALLED_PART_IDS,
  type MovementSide,
} from "@/lib/horology/caliber6497"
import { COURSE_1_LESSONS } from "@/lib/horology/course1"
import { CLEAN_SERVICE_CONDITIONS } from "@/lib/horology/physics"
import { useHorologySimBridge } from "@/lib/horology/use-sim-bridge"
import type { LoupePreset } from "@/components/bench/movement-viewport"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
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
        Mounting Unitas 6497-1 on Bergeon bench mat…
      </div>
    ),
  }
)

export function HomeView() {
  const installedSet = useMemo(() => new Set(ALL_INSTALLED_PART_IDS), [])
  const [dossier, setDossier] = useState<BenchDossierState>(DEFAULT_DOSSIER_STATE)
  const [selectedPartId, setSelectedPartId] = useState<string>("balance_assembly")
  const [side, setSide] = useState<MovementSide>("movement")
  const [loupePreset, setLoupePreset] = useState<LoupePreset>("bench")
  const [soundEnabled, setSoundEnabled] = useState(false)

  const sim = useHorologySimBridge({
    initialPosition: "DU",
    initialWind: 0.92,
    initialConditions: CLEAN_SERVICE_CONDITIONS,
  })

  useEffect(() => {
    void loadBenchDossier().then(setDossier)
  }, [])

  const completedCount = Object.values(dossier.completedLessons).filter(
    (c) => c.soloPassed
  ).length
  const activeLesson =
    COURSE_1_LESSONS.find((l) => l.id === dossier.activeLessonId) ??
    COURSE_1_LESSONS[0]

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--bench-mat)] text-foreground">
      <SiteHeader floating />

      {/* Full-bleed live running 3D Unitas 6497-1 movement */}
      <main className="relative h-full w-full">
        <MovementViewport
          readLiveSnapshot={sim.readLiveSnapshot}
          installedParts={installedSet}
          selectedPartId={selectedPartId}
          guidedPartId={null}
          onSelectPart={(pid) => setSelectedPartId(pid)}
          explodeAmount={0}
          side={side}
          loupePreset={loupePreset}
          overOiled={0}
          oilQuality={1}
          slowOrbit
        />

        {/* Quiet bottom-left bench invitation: one sentence, one primary CTA */}
        <section
          aria-label="Apprenticeship entrance"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col justify-between gap-4 p-4 sm:p-6 lg:flex-row lg:items-end"
        >
          <div className="pointer-events-auto max-w-md rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs tabular-nums text-muted-foreground">
              Calibre ETA <span className="font-mono">6497-1</span>,{" "}
              <span className="font-mono">
                {sim.uiSnapshot.amplitudeDeg.toFixed(0)}°
              </span>{" "}
              arc,{" "}
              <span className="font-mono">
                {sim.uiSnapshot.rateSecPerDay >= 0 ? "+" : ""}
                {sim.uiSnapshot.rateSecPerDay.toFixed(1)}
              </span>{" "}
              s/d
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              One movement. One master.
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Disassemble, clean, oil, and regulate a 17-jewel pocket-watch
              movement by hand alongside watchmaker Henri Delacroix.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={`/bench?lesson=${activeLesson.id}`} />}
              >
                {completedCount > 0
                  ? `Resume Lesson ${activeLesson.number}`
                  : "Begin your apprenticeship"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  horologyAudio.unlockContext()
                  const next = !soundEnabled
                  setSoundEnabled(next)
                  horologyAudio.setMuted(!next)
                }}
              >
                {soundEnabled ? (
                  <Volume2 className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <VolumeX className="size-4" aria-hidden="true" />
                )}
                {soundEnabled ? "2.5 Hz tick on" : "Listen to tick"}
              </Button>
            </div>
          </div>

          {/* Quiet bottom-right inspection switches (ghost only, never competing with primary CTA) */}
          <div className="pointer-events-auto hidden items-center gap-1 rounded-xl border border-border bg-card p-1 sm:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSide((s) => (s === "movement" ? "dial" : "movement"))
              }
            >
              {side === "movement" ? "Turn to dial" : "Turn to bridges"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                loupePreset === "escapement10x" &&
                  "bg-secondary text-foreground ring-1 ring-border"
              )}
              onClick={() =>
                setLoupePreset((l) =>
                  l === "escapement10x" ? "bench" : "escapement10x"
                )
              }
            >
              {loupePreset === "escapement10x" ? "1× Bench" : "10× Escapement"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
