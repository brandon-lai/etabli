"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import {
  Activity,
  Archive,
  Camera,
  CheckCircle2,
  Eye,
  FlipHorizontal,
  Gauge,
  Hand,
  Layers,
  PanelRight,
  Play,
  RotateCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react"
import {
  loadBenchDossier,
  saveBenchDossier,
  type BenchDossierState,
  type ReplayActionEntry,
  DEFAULT_DOSSIER_STATE,
} from "@/lib/bench-storage"
import { horologyAudio } from "@/lib/horology/audio-engine"
import {
  BENCH_TOOLS,
  getBlockingPartsForRemoval,
  getMissingPartsForInstall,
  getPartById,
  LUBRICANTS,
  type BenchToolId,
  type LubricantId,
  type MovementSide,
} from "@/lib/horology/caliber6497"
import {
  COURSE_1_LESSONS,
  type LessonPhaseMode,
  type LessonSpec,
} from "@/lib/horology/course1"
import {
  CLEAN_SERVICE_CONDITIONS,
  evaluate6497Health,
  type ServiceConditionState,
} from "@/lib/horology/physics"
import { useHorologySimBridge } from "@/lib/horology/use-sim-bridge"
import type {
  LoupePreset,
  MovementViewportHandle,
} from "@/components/bench/movement-viewport"
import { PartsTrayDialog } from "@/components/bench/parts-tray-dialog"
import { TimegrapherDrawer } from "@/components/bench/timegrapher-drawer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
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
        Preparing Unitas 6497-1 movement holder…
      </div>
    ),
  }
)

export function BenchWorkspace({ initialLessonId }: { initialLessonId?: string }) {
  const viewportRef = useRef<MovementViewportHandle | null>(null)
  const [dossier, setDossier] = useState<BenchDossierState>(DEFAULT_DOSSIER_STATE)

  const initialLesson = useMemo(() => {
    return (
      COURSE_1_LESSONS.find((l) => l.id === initialLessonId) ??
      COURSE_1_LESSONS[0]
    )
  }, [initialLessonId])

  const [lesson, setLesson] = useState<LessonSpec>(initialLesson)
  const [phase, setPhase] = useState<LessonPhaseMode>("show")
  const [stepIndex, setStepIndex] = useState(0)

  // Physical movement state on the bench
  const [installedParts, setInstalledParts] = useState<Set<string>>(
    () => new Set(initialLesson.startingInstalledParts)
  )
  const [mainspringLetDown, setMainspringLetDown] = useState<boolean>(
    initialLesson.startingMainspringLetDown
  )
  const [cleanedInUltrasonic, setCleanedInUltrasonic] = useState<boolean>(false)
  const [conditions, setConditions] = useState<ServiceConditionState>(
    initialLesson.startingConditions
  )
  const [regulatorMicrons, setRegulatorMicrons] = useState<number>(
    initialLesson.startingRegulatorMicrons ?? 0
  )
  const [colletOffsetDeg, setColletOffsetDeg] = useState<number>(
    initialLesson.startingColletOffsetDeg ?? 0
  )

  // Bench controls & active tool
  const [activeTool, setActiveTool] = useState<BenchToolId>("tweezers")
  const [activeLubricant, setActiveLubricant] =
    useState<LubricantId>("moebius_9010")
  const [floodOilerDose, setFloodOilerDose] = useState(false)
  const [braceEngaged, setBraceEngaged] = useState(false)
  const [leftHandMode, setLeftHandMode] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState<string | null>(
    "balance_assembly"
  )
  const [side, setSide] = useState<MovementSide>(initialLesson.defaultSide)
  const [loupePreset, setLoupePreset] = useState<LoupePreset>("bench")
  const [explodeAmount, setExplodeAmount] = useState(0)
  const [muted, setMuted] = useState(false)
  const [trayOpen, setTrayOpen] = useState(false)
  const [timegrapherOpen, setTimegrapherOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  // Replay & feedback
  const [henriBanner, setHenriBanner] = useState<string>(initialLesson.henriIntro)
  const [replayLog, setReplayLog] = useState<ReplayActionEntry[]>([])
  const [slipsCount, setSlipsCount] = useState(0)
  const sessionStartMsRef = useRef<number>(Date.now())

  const sim = useHorologySimBridge({
    initialPosition: "DU",
    initialWind: initialLesson.startingWindFraction,
    initialConditions: initialLesson.startingConditions,
    initialRegulatorMicrons: initialLesson.startingRegulatorMicrons ?? 0,
    initialColletOffsetDeg: initialLesson.startingColletOffsetDeg ?? 0,
  })

  // Load saved IndexedDB dossier on mount
  useEffect(() => {
    void loadBenchDossier().then((loaded) => {
      setDossier(loaded)
      if (!initialLessonId) {
        const savedLesson = COURSE_1_LESSONS.find(
          (l) => l.id === loaded.activeLessonId
        )
        if (savedLesson) {
          applyLessonSetup(savedLesson, loaded.activePhase)
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync assembly state into 10 kHz WASM core whenever parts change
  useEffect(() => {
    const oscReady =
      installedParts.has("mainplate") && installedParts.has("balance_assembly")
    const escReady =
      oscReady &&
      installedParts.has("pallet_cock_fork") &&
      installedParts.has("escape_wheel")
    const trainReady =
      escReady &&
      installedParts.has("train_bridge") &&
      installedParts.has("fourth_wheel") &&
      installedParts.has("third_wheel") &&
      installedParts.has("center_wheel") &&
      installedParts.has("mainspring_barrel") &&
      installedParts.has("barrel_bridge")
    sim.setAssemblyState(oscReady, escReady, trainReady)
  }, [installedParts, sim])

  const applyLessonSetup = useCallback(
    (targetLesson: LessonSpec, targetPhase: LessonPhaseMode) => {
      setLesson(targetLesson)
      setPhase(targetPhase)
      setStepIndex(0)
      setInstalledParts(new Set(targetLesson.startingInstalledParts))
      setMainspringLetDown(targetLesson.startingMainspringLetDown)
      setCleanedInUltrasonic(targetLesson.number >= 7)
      setConditions(targetLesson.startingConditions)
      const reg = targetLesson.startingRegulatorMicrons ?? 0
      const col = targetLesson.startingColletOffsetDeg ?? 0
      setRegulatorMicrons(reg)
      setColletOffsetDeg(col)
      setSide(targetLesson.defaultSide)
      setExplodeAmount(0)
      setBraceEngaged(false)
      setLeftHandMode(false)
      setReplayLog([])
      setSlipsCount(0)
      sessionStartMsRef.current = Date.now()
      setHenriBanner(targetLesson.henriIntro)

      sim.setWindFraction(targetLesson.startingWindFraction)
      sim.setRegulatorMicrons(reg)
      sim.setColletOffsetDeg(col)
      sim.setServiceConditions(targetLesson.startingConditions, true)
    },
    [sim]
  )

  const appendReplay = useCallback(
    (entry: Omit<ReplayActionEntry, "timestampSec">) => {
      const elapsedSec = Number(
        ((Date.now() - sessionStartMsRef.current) / 1000).toFixed(1)
      )
      setReplayLog((prev) => [...prev, { ...entry, timestampSec: elapsedSec }])
    },
    []
  )

  const currentStep = lesson.steps[stepIndex] ?? null

  const completeCurrentPhase = useCallback(
    async (finalLog: ReplayActionEntry[], finalSlips: number) => {
      if (phase === "show") {
        toast.success("Demonstration complete: your turn with Henri's guidance.")
        applyLessonSetup(lesson, "guide")
        return
      }
      if (phase === "guide") {
        toast.success(
          "Guided pass complete: guides off for your Solo qualification."
        )
        applyLessonSetup(lesson, "solo")
        return
      }
      if (phase === "solo") {
        setPhase("debrief")
        setHenriBanner(lesson.henriDebriefPass)
        const snap = sim.readLiveSnapshot()

        const prevRec = dossier.completedLessons[lesson.id]
        const nextIdx = COURSE_1_LESSONS.findIndex((l) => l.id === lesson.id) + 1
        const nextLesson = COURSE_1_LESSONS[nextIdx] ?? lesson

        const nextDossier: BenchDossierState = {
          ...dossier,
          activeLessonId: nextLesson.id,
          activePhase: "show",
          completedLessons: {
            ...dossier.completedLessons,
            [lesson.id]: {
              lessonId: lesson.id,
              completedPhases: ["show", "guide", "solo", "debrief"],
              soloPassed: true,
              bestRateSecPerDay: Number(snap.rateSecPerDay.toFixed(1)),
              bestAmplitudeDeg: Number(snap.amplitudeDeg.toFixed(1)),
              bestBeatErrorMs: Number(snap.beatErrorMs.toFixed(2)),
              slipsCount: prevRec
                ? Math.min(prevRec.slipsCount, finalSlips)
                : finalSlips,
              completedAtIso: new Date().toISOString(),
              replayLog: finalLog,
            },
          },
          updatedAtIso: new Date().toISOString(),
        }
        setDossier(nextDossier)
        await saveBenchDossier(nextDossier)

        // Best-effort remote telemetry sync if DATABASE_URL is configured
        void fetch("/api/telemetry", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            phaseMode: "solo",
            positionCode: sim.position,
            amplitudeDeg: snap.amplitudeDeg,
            rateSecPerDay: snap.rateSecPerDay,
            beatErrorMs: snap.beatErrorMs,
            slipsCount: finalSlips,
            soloPassed: true,
          }),
        }).catch(() => {})
      }
    },
    [applyLessonSetup, dossier, lesson, phase, sim]
  )

  const handleSoloFailure = useCallback(
    (reason: string, stepTitle: string, partId?: string) => {
      horologyAudio.playToolFoley("error")
      const nextSlips = slipsCount + 1
      setSlipsCount(nextSlips)
      appendReplay({
        stepTitle,
        partId,
        toolId: activeTool,
        outcome: "slip",
        note: reason,
      })

      if (phase === "solo") {
        toast.error(
          "Solo check missed: returning to Guided mode to steady that step."
        )
        applyLessonSetup(lesson, "guide")
        setHenriBanner(
          `${reason} Let us walk through that operation together once more in Guide mode.`
        )
      } else {
        setHenriBanner(reason)
        toast.warning(reason)
      }
    },
    [activeTool, appendReplay, applyLessonSetup, lesson, phase, slipsCount]
  )

  const advanceStepSuccess = useCallback(
    (note: string, partId?: string) => {
      const title = currentStep?.title ?? "Bench action"
      const entry: ReplayActionEntry = {
        timestampSec: Number(
          ((Date.now() - sessionStartMsRef.current) / 1000).toFixed(1)
        ),
        stepTitle: title,
        partId,
        toolId: activeTool,
        outcome: "clean",
        note,
      }
      const nextLog = [...replayLog, entry]
      setReplayLog(nextLog)

      if (stepIndex + 1 < lesson.steps.length) {
        const nextStep = lesson.steps[stepIndex + 1]
        setStepIndex(stepIndex + 1)
        if (nextStep.targetPartId) {
          const p = getPartById(nextStep.targetPartId)
          if (p) setSide(p.side)
        }
        setHenriBanner(
          phase === "show"
            ? nextStep.masterShow
            : phase === "guide"
              ? nextStep.masterGuide
              : "Solo bench: carry on to the next physical operation."
        )
      } else {
        void completeCurrentPhase(nextLog, slipsCount)
      }
    },
    [
      activeTool,
      completeCurrentPhase,
      currentStep,
      lesson.steps,
      phase,
      replayLog,
      slipsCount,
      stepIndex,
    ]
  )

  // Execute Master Henri's demonstration step automatically in Show mode
  const runHenriShowStep = useCallback(() => {
    if (!currentStep) return
    horologyAudio.unlockContext()
    const pid = currentStep.targetPartId
    if (pid) {
      setSelectedPartId(pid)
      const spec = getPartById(pid)
      if (spec) setSide(spec.side)
    }

    switch (currentStep.action) {
      case "inspect_part":
        horologyAudio.playToolFoley("tweezer")
        advanceStepSuccess(`Henri inspected ${pid ?? "movement"}`, pid)
        break
      case "open_timegrapher":
        setTimegrapherOpen(true)
        advanceStepSuccess("Henri opened the 44° acoustic timegrapher")
        break
      case "let_down_mainspring":
        horologyAudio.playToolFoley("letdown")
        setMainspringLetDown(true)
        setInstalledParts((prev) => {
          const n = new Set(prev)
          n.delete("mainspring_power")
          return n
        })
        sim.setWindFraction(0)
        advanceStepSuccess("Henri eased click 425 and discharged barrel torque", pid)
        break
      case "remove_part":
        if (pid) {
          horologyAudio.playToolFoley(
            currentStep.requiredBladeMm ? "screw" : "tweezer"
          )
          setInstalledParts((prev) => {
            const n = new Set(prev)
            n.delete(pid)
            return n
          })
          advanceStepSuccess(`Henri removed ${pid} into dust-cover tray`, pid)
        }
        break
      case "ultrasonic_clean":
        horologyAudio.playToolFoley("ultrasonic")
        setCleanedInUltrasonic(true)
        setConditions(CLEAN_SERVICE_CONDITIONS)
        sim.setServiceConditions(CLEAN_SERVICE_CONDITIONS, true)
        advanceStepSuccess("Henri completed 3-bath ultrasonic wash & warm dry")
        break
      case "install_part":
        if (pid) {
          horologyAudio.playToolFoley(
            currentStep.requiredBladeMm ? "screw" : "tweezer"
          )
          setInstalledParts((prev) => {
            const n = new Set(prev)
            n.add(pid)
            return n
          })
          advanceStepSuccess(`Henri seated ${pid} cleanly`, pid)
        }
        break
      case "oil_part":
        horologyAudio.playToolFoley("oil")
        setConditions((prev) => {
          const next = {
            ...prev,
            trainOilQuality: 1.0,
            palletOilQuality: 1.0,
            balanceOilQuality: 1.0,
            overOiledFactor: 0.0,
          }
          sim.setServiceConditions(next, true)
          return next
        })
        advanceStepSuccess(
          `Henri applied ${currentStep.requiredLubricant ?? "Moebius oil"} (60% meniscus)`,
          pid
        )
        break
      case "wind_crown":
        horologyAudio.playToolFoley("screw")
        setMainspringLetDown(false)
        setInstalledParts((prev) => new Set(prev).add("mainspring_power"))
        sim.setWindFraction(0.65)
        advanceStepSuccess("Henri wound two smooth turns into the barrel")
        break
      case "demagnetize":
        horologyAudio.playToolFoley("demag")
        setConditions((prev) => {
          const next = { ...prev, magnetizedFactor: 0.0 }
          sim.setServiceConditions(next, true)
          return next
        })
        advanceStepSuccess("Henri withdrew movement through tunnel demagnetizer")
        break
      case "regulate_watch":
        setRegulatorMicrons(0)
        setColletOffsetDeg(0)
        sim.setRegulatorMicrons(0)
        sim.setColletOffsetDeg(0)
        advanceStepSuccess("Henri zeroed beat error and regulated rate flat")
        break
    }
  }, [advanceStepSuccess, currentStep, sim])

  // Player executes physical interaction on a part (from 3D viewport or Parts Tray)
  const executePartInteraction = useCallback(
    (partId: string, mode: "viewport_click" | "tray_mount") => {
      horologyAudio.unlockContext()
      setSelectedPartId(partId)
      const partSpec = getPartById(partId)
      if (!partSpec) return

      if (phase === "show" || phase === "debrief") {
        setHenriBanner(`${partSpec.name} (${partSpec.etaNumber}): ${partSpec.plainFunction}`)
        return
      }

      // 1. Inspection action
      if (
        currentStep?.action === "inspect_part" &&
        currentStep.targetPartId === partId
      ) {
        if (currentStep.requiredTool && activeTool !== currentStep.requiredTool) {
          setHenriBanner(
            `Pick up ${BENCH_TOOLS.find((t) => t.id === currentStep.requiredTool)?.name} first.`
          )
          return
        }
        horologyAudio.playToolFoley("tweezer")
        advanceStepSuccess(`Inspected ${partSpec.name}`, partId)
        return
      }

      // 2. Letting down the mainspring via Click 425
      if (partId === "mainspring_power" && installedParts.has("mainspring_power")) {
        if (activeTool !== "pegwood") {
          handleSoloFailure(
            "Use sharpened Boxwood Pegwood (6) to ease click 425 without scratching the steel ratchet.",
            "Mainspring let-down",
            partId
          )
          return
        }
        if (!braceEngaged) {
          handleSoloFailure(
            "Hold thumb control on the crown (Shift Brace ON) before releasing the click, or 46 hours of torque unwinds backward.",
            "Uncontrolled click release",
            partId
          )
          return
        }
        horologyAudio.playToolFoley("letdown")
        setMainspringLetDown(true)
        setInstalledParts((prev) => {
          const n = new Set(prev)
          n.delete("mainspring_power")
          return n
        })
        sim.setWindFraction(0)
        toast.success("Mainspring safely discharged turn by turn.")
        if (currentStep?.action === "let_down_mainspring") {
          advanceStepSuccess("Discharged mainspring safely via click 425", partId)
        }
        return
      }

      // 3. Oiling an installed jewel/assembly with Micro-Oiler
      if (activeTool === "oiler" && installedParts.has(partId)) {
        if (partSpec.requiredLubricant === "none") {
          handleSoloFailure(
            partSpec.mustStayDryWarning ??
              `${partSpec.name} must remain completely dry: oil here collects dust and drags amplitude.`,
            "Oiled a dry surface",
            partId
          )
          return
        }
        if (activeLubricant !== partSpec.requiredLubricant) {
          const expectedName =
            LUBRICANTS.find((l) => l.id === partSpec.requiredLubricant)?.name ??
            partSpec.requiredLubricant
          handleSoloFailure(
            `Wrong Moebius viscosity on ${partSpec.name}: this bearing requires ${expectedName}.`,
            "Wrong lubricant grade",
            partId
          )
          return
        }
        horologyAudio.playToolFoley("oil")
        setConditions((prev) => {
          const next: ServiceConditionState = {
            ...prev,
            trainOilQuality: 1.0,
            palletOilQuality:
              partId === "pallet_cock_fork" ? 1.0 : prev.palletOilQuality,
            balanceOilQuality:
              partId === "balance_assembly" ? 1.0 : prev.balanceOilQuality,
            overOiledFactor: floodOilerDose ? 1.0 : 0.0,
          }
          sim.setServiceConditions(next, true)
          return next
        })
        if (floodOilerDose) {
          toast.warning(
            "Jewel sink flooded past meniscus. Open the timegrapher and run +14d Check to observe oil creep."
          )
        } else {
          toast.success(`Clean 60% meniscus applied to ${partSpec.name}.`)
        }
        if (
          currentStep?.action === "oil_part" &&
          currentStep.targetPartId === partId
        ) {
          if (floodOilerDose) {
            handleSoloFailure(
              "Excess oil spilled over the chamfered ruby sink. Set dose to Clean 60% Meniscus so oil stays in the bearing.",
              "Over-oiled jewel sink",
              partId
            )
            return
          }
          advanceStepSuccess(`Oiled ${partSpec.name} with ${activeLubricant}`, partId)
        }
        return
      }

      // 4. Removing an installed part (governed by physical dependency graph!)
      if (mode === "viewport_click" && installedParts.has(partId)) {
        if (partId === "mainplate") {
          setHenriBanner(
            "The 36.60 mm mainplate stays clamped in your movement holder as the structural datum."
          )
          return
        }
        const blockCheck = getBlockingPartsForRemoval(
          partId,
          installedParts,
          mainspringLetDown
        )
        if (blockCheck.needsLetDown) {
          handleSoloFailure(
            `Stop: the mainspring barrel is still wound. Lifting ${partSpec.name} under torque spins the train and shears 0.07 mm pivots.`,
            "Bridge lifted under mainspring load",
            partId
          )
          return
        }
        if (blockCheck.blockers.length > 0) {
          const names = blockCheck.blockers.map((b) => b.name).join(", ")
          setHenriBanner(
            `${partSpec.name} is physically held down by: ${names}. Remove blocking parts first.`
          )
          toast.message(`Blocked by ${names}`)
          return
        }
        if (activeTool !== partSpec.removalTool) {
          const reqTool = BENCH_TOOLS.find((t) => t.id === partSpec.removalTool)
          handleSoloFailure(
            `Wrong tool on ${partSpec.name}: use ${reqTool?.name ?? partSpec.removalTool}${partSpec.screwBladeMm ? ` (${partSpec.screwBladeMm.toFixed(2)} mm exact slot fit)` : ""} so you do not mar blued screws or rhodium striping.`,
            "Tool mismatch on removal",
            partId
          )
          return
        }
        if (partSpec.leftHandThreadNote && !leftHandMode) {
          handleSoloFailure(
            "Left-hand thread risk: triple-slotted crown wheel screw 5420 unscrews clockwise. Toggle Reverse Thread (R) first.",
            "Turned left-hand crown screw counter-clockwise",
            partId
          )
          return
        }
        if (
          (partId === "hands_set" || partSpec.highLaunchRisk) &&
          !braceEngaged
        ) {
          handleSoloFailure(
            partId === "hands_set"
              ? "Slip the protective dial sheet (Shift Guard ON) under your hand levers before prying over Grand Feu enamel."
              : "Hold boxwood pegwood (Shift Brace ON) over yoke spring 440 before unhooking it so the spring cannot launch.",
            "Missing protective brace/sheet",
            partId
          )
          return
        }

        horologyAudio.playToolFoley(partSpec.screwBladeMm ? "screw" : "tweezer")
        setInstalledParts((prev) => {
          const n = new Set(prev)
          n.delete(partId)
          return n
        })
        toast.success(
          `Placed ${partSpec.name} into Tray Compartment ${partSpec.trayCompartment}.`
        )
        if (
          currentStep?.action === "remove_part" &&
          currentStep.targetPartId === partId
        ) {
          advanceStepSuccess(`Removed ${partSpec.name}`, partId)
        }
        return
      }

      // 5. Mounting a removed part from Tray or Ghost Guide
      if (!installedParts.has(partId)) {
        const mountCheck = getMissingPartsForInstall(partId, installedParts)
        if (!mountCheck.canMount) {
          const missingNames = mountCheck.missing.map((m) => m.name).join(", ")
          setHenriBanner(
            `Cannot mount ${partSpec.name} yet: seat ${missingNames} on the mainplate first.`
          )
          toast.message(`Requires ${missingNames} first`)
          return
        }
        if (activeTool !== partSpec.installTool) {
          const reqTool = BENCH_TOOLS.find((t) => t.id === partSpec.installTool)
          handleSoloFailure(
            `Use ${reqTool?.name ?? partSpec.installTool} to mount ${partSpec.name} cleanly.`,
            "Tool mismatch on install",
            partId
          )
          return
        }
        if (
          (partId === "train_bridge" || partSpec.highLaunchRisk) &&
          !braceEngaged
        ) {
          handleSoloFailure(
            partId === "train_bridge"
              ? "Never drive bridge screws cold. Enable Pegwood Pivot Seating (Shift) so 3rd, 4th, and escape pivots drop into their ruby holes before tightening."
              : "Brace yoke spring 440 with pegwood (Shift) while seating keyless works.",
            "Tightened bridge before seating pivots",
            partId
          )
          return
        }

        horologyAudio.playToolFoley(partSpec.screwBladeMm ? "screw" : "tweezer")
        setInstalledParts((prev) => new Set(prev).add(partId))
        toast.success(`Mounted ${partSpec.name} cleanly.`)
        if (
          currentStep?.action === "install_part" &&
          currentStep.targetPartId === partId
        ) {
          advanceStepSuccess(`Installed ${partSpec.name}`, partId)
        }
      }
    },
    [
      activeLubricant,
      activeTool,
      advanceStepSuccess,
      braceEngaged,
      currentStep,
      floodOilerDose,
      handleSoloFailure,
      installedParts,
      leftHandMode,
      mainspringLetDown,
      phase,
      sim,
    ]
  )

  // Bench hotkeys (strictly ignored when typing inside input/textarea/select)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const k = e.key.toLowerCase()
      const matchedTool = BENCH_TOOLS.find((t) => t.hotkey === k)
      if (matchedTool) {
        e.preventDefault()
        setActiveTool(matchedTool.id)
        return
      }
      if (e.key === " ") {
        e.preventDefault()
        setLoupePreset((prev) =>
          prev === "bench"
            ? "loupe4x"
            : prev === "loupe4x"
              ? "escapement10x"
              : "bench"
        )
      } else if (e.key === "Shift" && !e.repeat) {
        setBraceEngaged((b) => !b)
      } else if (k === "r") {
        e.preventDefault()
        setLeftHandMode((lh) => !lh)
      } else if (k === "p") {
        e.preventDefault()
        setTrayOpen((o) => !o)
      } else if (k === "t" || k === "g") {
        e.preventDefault()
        setTimegrapherOpen((o) => {
          const next = !o
          if (next && currentStep?.action === "open_timegrapher" && phase !== "show") {
            advanceStepSuccess("Opened acoustic timegrapher")
          }
          return next
        })
      } else if (k === "z") {
        e.preventDefault()
        if (stepIndex > 0) {
          const prevIdx = stepIndex - 1
          const prevStep = lesson.steps[prevIdx]
          setStepIndex(prevIdx)
          if (prevStep) {
            setHenriBanner(
              phase === "show" ? prevStep.masterShow : prevStep.masterGuide
            )
          }
          toast.message("Stepped back one operation.")
        } else {
          applyLessonSetup(lesson, phase)
          toast.message("Reset current bench phase.")
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [advanceStepSuccess, applyLessonSetup, currentStep, lesson, phase, stepIndex])

  const handleCheckRegulationPass = () => {
    const snap = sim.readLiveSnapshot()
    const health = evaluate6497Health(snap, "DU")
    if (conditions.magnetizedFactor > 0.1) {
      handleSoloFailure(
        "The hairspring is still magnetized. Run the Tunnel Demagnetizer (M) before signing off regulation.",
        "Signed off while magnetized"
      )
      return
    }
    if (!health.beatHealthy) {
      handleSoloFailure(
        `Beat error is ${snap.beatErrorMs.toFixed(2)} ms (must be below 0.50 ms). Center the Stud / Beat Collet slider first.`,
        "Beat error out of spec"
      )
      return
    }
    if (Math.abs(snap.rateSecPerDay) > 5.5) {
      handleSoloFailure(
        `Daily rate is ${snap.rateSecPerDay.toFixed(1)} s/d (target within ±5.0 s/d). Nudge the Regulator Index.`,
        "Rate out of spec"
      )
      return
    }
    if (!health.amplitudeHealthy) {
      handleSoloFailure(
        `Amplitude is ${snap.amplitudeDeg.toFixed(0)}° (healthy full-wind Dial-Up band is 270° to 315°). Wind full and check lubrication.`,
        "Amplitude out of spec"
      )
      return
    }
    toast.success("6497-1 regulation verified inside chronometer workshop band.")
    if (currentStep?.action === "regulate_watch") {
      advanceStepSuccess(
        `Regulated to ${snap.rateSecPerDay >= 0 ? "+" : ""}${snap.rateSecPerDay.toFixed(1)} s/d, ${snap.amplitudeDeg.toFixed(0)}°, ${snap.beatErrorMs.toFixed(2)} ms`
      )
    }
  }

  const handleExportPngRender = () => {
    const snap = sim.readLiveSnapshot()
    const dataUrl = viewportRef.current?.captureShareCardPng({
      title: `Lesson ${lesson.number}: ${lesson.title}`,
      rateText: `${snap.rateSecPerDay >= 0 ? "+" : ""}${snap.rateSecPerDay.toFixed(1)} s/d`,
      amplitudeText: `${snap.amplitudeDeg.toFixed(0)}°`,
      beatErrorText: `${snap.beatErrorMs.toFixed(2)} ms`,
      positionCode: sim.position,
    })
    if (!dataUrl) {
      toast.error("Render canvas not ready yet.")
      return
    }
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `etabli-6497-lesson-${lesson.number}.png`
    a.click()
    toast.success("Downloaded stamped high-resolution 6497-1 bench render.")
  }

  const selectedSpec = selectedPartId ? getPartById(selectedPartId) : null
  const removedCount =
    16 - (installedParts.size - (installedParts.has("mainspring_power") ? 1 : 0))
  const guidedPartId =
    phase === "guide" || phase === "show"
      ? (currentStep?.targetPartId ?? null)
      : null

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--bench-mat)] text-foreground">
      <SiteHeader floating />

      {/* Full-bleed Unitas 6497-1 Movement Viewport ("the movement is the screen") */}
      <main className="relative h-full w-full">
        <MovementViewport
          onReady={(handle) => {
            viewportRef.current = handle
          }}
          readLiveSnapshot={sim.readLiveSnapshot}
          installedParts={installedParts}
          selectedPartId={selectedPartId}
          guidedPartId={guidedPartId}
          onSelectPart={(partId) =>
            executePartInteraction(partId, "viewport_click")
          }
          explodeAmount={explodeAmount}
          side={side}
          loupePreset={loupePreset}
          overOiled={conditions.overOiledFactor}
          oilQuality={conditions.trainOilQuality}
        />

        {/* Top Edge Overlay: Left = Henri Bench Guidance | Right = Loupe, Side, Sound & Timegrapher */}
        <section
          aria-label="Master watchmaker bench guidance"
          className="pointer-events-none absolute top-15 left-3 right-3 z-20 flex flex-col gap-2 sm:left-5 sm:right-5 xl:flex-row xl:items-start xl:justify-between"
        >
          {/* Compact Master Henri Subtitle & Phase Strip */}
          <div className="pointer-events-auto flex max-w-2xl flex-col gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <label htmlFor="bench-lesson-picker" className="sr-only">
                  Select Course 1 Lesson
                </label>
                <select
                  id="bench-lesson-picker"
                  value={lesson.id}
                  onChange={(e) => {
                    const found = COURSE_1_LESSONS.find(
                      (l) => l.id === e.target.value
                    )
                    if (found) applyLessonSetup(found, "show")
                  }}
                  className="min-h-9 w-full max-w-full min-w-0 truncate rounded-lg border border-input bg-background px-2 py-1 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none sm:w-auto sm:max-w-xs"
                >
                  {COURSE_1_LESSONS.map((l) => (
                    <option key={l.id} value={l.id}>
                      L{String(l.number).padStart(2, "0")}: {l.title}
                    </option>
                  ))}
                </select>

                <div
                  role="group"
                  aria-label="Apprenticeship lesson phase"
                  className="inline-flex rounded-lg border border-border bg-secondary/60 p-0.5"
                >
                  {(["show", "guide", "solo"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => applyLessonSetup(lesson, m)}
                      className={cn(
                        "min-h-8 rounded-md px-2.5 py-0.5 text-xs font-medium capitalize transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                        phase === m
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <Badge variant="outline" className="font-mono tabular-nums">
                  {Math.min(stepIndex + 1, lesson.steps.length)}/{lesson.steps.length}
                </Badge>
              </div>

              {/* Single primary bench action when needed */}
              <div className="flex shrink-0 items-center gap-1.5">
                {phase === "show" && currentStep ? (
                  <>
                    <Button size="xs" onClick={runHenriShowStep}>
                      <Play className="size-3" aria-hidden="true" />
                      Henri Step {stepIndex + 1}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => applyLessonSetup(lesson, "guide")}
                    >
                      Practice
                    </Button>
                  </>
                ) : null}

                {phase !== "show" && currentStep?.action === "wind_crown" ? (
                  <Button
                    size="xs"
                    onClick={() => {
                      horologyAudio.playToolFoley("screw")
                      setMainspringLetDown(false)
                      setInstalledParts((prev) =>
                        new Set(prev).add("mainspring_power")
                      )
                      sim.setWindFraction(
                        Math.min(1, sim.uiSnapshot.windFraction + 0.35)
                      )
                      advanceStepSuccess("Wound two smooth turns into barrel")
                    }}
                  >
                    <Wind className="size-3.5" aria-hidden="true" />
                    Wind Crown
                  </Button>
                ) : null}

                {phase !== "show" && currentStep?.action === "demagnetize" ? (
                  <Button
                    size="xs"
                    onClick={() => {
                      if (activeTool !== "demagnetizer") {
                        handleSoloFailure(
                          "Equip the Tunnel Demagnetizer (M) from your rack first.",
                          "Demagnetizer not selected"
                        )
                        return
                      }
                      horologyAudio.playToolFoley("demag")
                      setConditions((prev) => {
                        const next = { ...prev, magnetizedFactor: 0 }
                        sim.setServiceConditions(next, true)
                        return next
                      })
                      toast.success("Alternating field decayed to zero: coils freed.")
                      advanceStepSuccess("Demagnetized hairspring in tunnel coil")
                    }}
                  >
                    Demagnetize
                  </Button>
                ) : null}

                {phase !== "show" && currentStep?.action === "regulate_watch" ? (
                  <Button size="xs" onClick={handleCheckRegulationPass}>
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Verify Regulation
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="line-clamp-2 text-xs leading-relaxed text-foreground/95 sm:text-sm">
              {henriBanner}
            </p>
          </div>

            {/* Mobile compact optical strip (<640px) tucked into one slim row; Desktop full optical bar (>=640px) */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1 self-start rounded-xl border border-border bg-card p-1 shadow-xs">
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                setSide((s) => (s === "movement" ? "dial" : "movement"))
              }
            >
              <FlipHorizontal className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">
                {side === "movement" ? "Bridge" : "Dial"}
              </span>
            </Button>

            {/* Mobile single-tap loupe cycle button (<640px) */}
            <Button
              variant="ghost"
              size="xs"
              className="bg-secondary text-foreground ring-1 ring-primary/60 sm:hidden"
              onClick={() =>
                setLoupePreset((prev) =>
                  prev === "bench"
                    ? "loupe4x"
                    : prev === "loupe4x"
                      ? "escapement10x"
                      : "bench"
                )
              }
            >
              <Eye className="size-3" aria-hidden="true" />
              {loupePreset === "bench"
                ? "1×"
                : loupePreset === "loupe4x"
                  ? "4×"
                  : "10×"}
            </Button>

            {/* Desktop explicit loupe buttons (>=640px) */}
            {(
              [
                ["bench", "1×"],
                ["loupe4x", "4×"],
                ["escapement10x", "10×"],
              ] as const
            ).map(([preset, label]) => (
              <Button
                key={preset}
                data-loupe={preset}
                variant="ghost"
                size="xs"
                title="Cycle loupe magnification (Space)"
                className={cn(
                  "hidden sm:inline-flex",
                  loupePreset === preset &&
                    "bg-secondary text-foreground ring-1 ring-primary/60"
                )}
                onClick={() => setLoupePreset(preset)}
              >
                <Eye className="size-3" aria-hidden="true" />
                {label}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="xs"
              className={cn(
                "hidden sm:inline-flex",
                sim.timeScale < 0.2 &&
                  "bg-secondary text-foreground ring-1 ring-primary/60"
              )}
              onClick={() =>
                sim.setTimeScale(sim.timeScale < 0.2 ? 1.0 : 0.04)
              }
            >
              <Gauge className="size-3" aria-hidden="true" />
              {sim.timeScale < 0.2 ? "0.04×" : "1×"}
            </Button>

            <Button
              data-timegrapher-toggle="true"
              variant="outline"
              size="xs"
              onClick={() => {
                setTimegrapherOpen((o) => !o)
                if (
                  phase !== "show" &&
                  currentStep?.action === "open_timegrapher"
                ) {
                  advanceStepSuccess("Opened 44° acoustic timegrapher")
                }
              }}
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
              size="icon-xs"
              aria-label={
                muted ? "Unmute escapement ticks" : "Mute escapement ticks"
              }
              onClick={() => {
                horologyAudio.unlockContext()
                const next = !muted
                setMuted(next)
                horologyAudio.setMuted(next)
              }}
            >
              {muted ? (
                <VolumeX className="size-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="size-3.5" aria-hidden="true" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Download stamped PNG bench render"
              onClick={handleExportPngRender}
            >
              <Camera className="size-3.5" aria-hidden="true" />
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Toggle part technical sheet"
              className={cn(
                inspectorOpen &&
                  "bg-secondary text-foreground ring-1 ring-primary/60"
              )}
              onClick={() => setInspectorOpen((o) => !o)}
            >
              <PanelRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* Right-Edge Flat Technical Sheet / Lesson Debrief (hidden when Timegrapher is open; collapsible on mobile) */}
        {!timegrapherOpen ? (
          <aside
            aria-label="Selected component technical sheet"
            className={cn(
              "absolute right-3 bottom-28 z-20 max-h-[54dvh] w-76 flex-col overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-3.5 shadow-xs sm:right-5 lg:top-34 lg:bottom-auto",
              inspectorOpen || phase === "debrief" ? "flex" : "hidden xl:flex"
            )}
          >
            {phase === "debrief" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Lesson {lesson.number} Debrief
                  </h2>
                  <Badge variant="secondary">Solo Qualified</Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {lesson.henriDebriefPass}
                </p>

                <dl className="grid grid-cols-3 divide-x divide-border border-y border-border py-2 text-center text-xs tabular-nums">
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Rate</dt>
                    <dd className="font-semibold text-[var(--blued-steel)]">
                      <span className="font-mono">
                        {sim.uiSnapshot.rateSecPerDay >= 0 ? "+" : ""}
                        {sim.uiSnapshot.rateSecPerDay.toFixed(1)}
                      </span>{" "}
                      s/d
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Amp</dt>
                    <dd className="font-mono font-semibold text-[var(--blued-steel)]">
                      {sim.uiSnapshot.amplitudeDeg.toFixed(0)}°
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Slips</dt>
                    <dd className="font-mono font-semibold text-foreground">
                      {slipsCount}
                    </dd>
                  </div>
                </dl>

                <div className="max-h-32 divide-y divide-border overflow-y-auto overscroll-contain text-xs">
                  {replayLog.map((entry, idx) => (
                    <div
                      key={`${entry.timestampSec}-${idx}`}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <span className="truncate text-muted-foreground">
                        {entry.note}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <span className="font-mono">{entry.timestampSec}</span> s
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {lesson.number < COURSE_1_LESSONS.length ? (
                    <Button
                      size="xs"
                      onClick={() => {
                        const next = COURSE_1_LESSONS[lesson.number]
                        if (next) applyLessonSetup(next, "show")
                      }}
                    >
                      Continue to Lesson {lesson.number + 1}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleExportPngRender}
                  >
                    Save PNG Card
                  </Button>
                </div>
              </div>
            ) : selectedSpec ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary">
                    {selectedSpec.etaNumber}
                  </span>
                  <Badge variant="outline">
                    {installedParts.has(selectedSpec.id)
                      ? "Mounted"
                      : `Tray #${selectedSpec.trayCompartment}`}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {selectedSpec.name}
                  </h2>
                  <p className="text-xs italic text-muted-foreground">
                    {selectedSpec.frenchTerm}
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {selectedSpec.plainFunction}
                </p>

                <dl className="divide-y divide-border border-y border-border text-xs">
                  <div className="flex justify-between gap-2 py-1.5">
                    <dt className="text-muted-foreground">Material</dt>
                    <dd className="text-right font-medium text-foreground">
                      {selectedSpec.material}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5">
                    <dt className="text-muted-foreground">Bearings</dt>
                    <dd className="text-right text-foreground">
                      <span className="font-mono">{selectedSpec.jewelCount}</span>{" "}
                      rubies
                      {selectedSpec.screwBladeMm
                        ? `, ${selectedSpec.screwBladeMm.toFixed(2)} mm`
                        : ""}
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

                {selectedSpec.leftHandThreadNote ? (
                  <p className="text-xs font-medium text-primary">
                    <ShieldAlert
                      className="mr-1 inline size-3.5"
                      aria-hidden="true"
                    />
                    {selectedSpec.leftHandThreadNote}
                  </p>
                ) : null}

                {!installedParts.has(selectedSpec.id) ? (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() =>
                      executePartInteraction(selectedSpec.id, "tray_mount")
                    }
                  >
                    Mount from Tray #{selectedSpec.trayCompartment}
                  </Button>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Select your tool below, then click this assembly directly on
                    the movement.
                  </p>
                )}
              </div>
            ) : null}
          </aside>
        ) : null}

        {/* Bottom Edge Compact Horological Tool Strip (hidden while Timegrapher is open) */}
        {!timegrapherOpen ? (
          <footer
            aria-label="Watchmaker bench tool rack"
            className="absolute inset-x-3 bottom-3 z-20 flex flex-col gap-1.5 rounded-xl border border-border bg-card px-3 py-2 shadow-xs sm:inset-x-5"
          >
            {/* Lubricant Stand Bar when Micro-Oiler (8) is active */}
            {activeTool === "oiler" ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-xs font-medium text-foreground">
                    Moebius Stand:
                  </span>
                  {LUBRICANTS.filter((l) => l.id !== "none").map((lub) => (
                    <Button
                      key={lub.id}
                      variant="ghost"
                      size="xs"
                      className={cn(
                        activeLubricant === lub.id
                          ? "bg-secondary text-foreground ring-1 ring-primary/60"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setActiveLubricant(lub.id)}
                    >
                      {lub.name.replace("Moebius ", "")}
                    </Button>
                  ))}
                </div>

                <Button
                  variant={floodOilerDose ? "destructive" : "outline"}
                  size="xs"
                  onClick={() => setFloodOilerDose((f) => !f)}
                >
                  {floodOilerDose
                    ? "Dose: Flooded 130% (Creep)"
                    : "Dose: Clean 60% Meniscus"}
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Mobile compact tool selector (<768px) — zero overflow or mid-word clipping */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5 md:hidden">
                <label htmlFor="mobile-tool-picker" className="sr-only">
                  Select watchmaker bench tool
                </label>
                <select
                  id="mobile-tool-picker"
                  value={activeTool}
                  onChange={(e) => setActiveTool(e.target.value as BenchToolId)}
                  className="min-h-9 min-w-0 flex-1 truncate rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
                >
                  {BENCH_TOOLS.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.shortLabel} ({tool.hotkey.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tablet & Desktop wrapped bench tools (>=768px) — zero horizontal overflow */}
              <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-1 md:flex">
                {BENCH_TOOLS.map((tool) => {
                  const selected = activeTool === tool.id
                  return (
                    <Button
                      key={tool.id}
                      variant="ghost"
                      size="xs"
                      onClick={() => setActiveTool(tool.id)}
                      title={tool.purpose}
                      className={cn(
                        selected
                          ? "bg-secondary font-semibold text-foreground ring-1 ring-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{tool.shortLabel}</span>
                      <Kbd className="hidden xl:inline-flex">
                        {tool.hotkey.toUpperCase()}
                      </Kbd>
                    </Button>
                  )
                })}
              </div>

              {/* Right Bench Modifiers & Parts Tray */}
              <div className="flex shrink-0 items-center gap-1">
                <div className="hidden items-center gap-2 pr-1 md:flex">
                  <Layers
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Slider
                    aria-label="Axial exploded view separation"
                    min={0}
                    max={100}
                    step={2}
                    value={[Math.round(explodeAmount * 100)]}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val
                      setExplodeAmount(Number(v) / 100)
                    }}
                    className="w-20"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="xs"
                  title="Hold wrist brace or dial guard (Shift)"
                  className={cn(
                    braceEngaged
                      ? "bg-secondary text-foreground ring-1 ring-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setBraceEngaged((b) => !b)}
                >
                  <Hand className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Brace</span>
                  <Kbd className="hidden xl:inline-flex">Shift</Kbd>
                </Button>

                <Button
                  variant="ghost"
                  size="xs"
                  title="Toggle left-hand reverse thread (R)"
                  className={cn(
                    leftHandMode
                      ? "bg-secondary text-foreground ring-1 ring-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setLeftHandMode((lh) => !lh)}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">LH</span>
                  <Kbd className="hidden xl:inline-flex">R</Kbd>
                </Button>

                <Button
                  variant="outline"
                  size="xs"
                  title="Open 6-compartment dust-cover tray (P)"
                  onClick={() => setTrayOpen(true)}
                >
                  <Archive className="size-3.5" aria-hidden="true" />
                  <span>Tray ({Math.max(0, removedCount)})</span>
                  <Kbd className="hidden xl:inline-flex">P</Kbd>
                </Button>
              </div>
            </div>
          </footer>
        ) : null}
      </main>

      <PartsTrayDialog
        open={trayOpen}
        onOpenChange={setTrayOpen}
        installedParts={installedParts}
        cleanedInUltrasonic={cleanedInUltrasonic}
        onInstallFromTray={(partId) =>
          executePartInteraction(partId, "tray_mount")
        }
        onInspectPart={(partId) => {
          setSelectedPartId(partId)
          setInspectorOpen(true)
        }}
        onRunUltrasonicClean={() => {
          horologyAudio.playToolFoley("ultrasonic")
          setCleanedInUltrasonic(true)
          setConditions(CLEAN_SERVICE_CONDITIONS)
          sim.setServiceConditions(CLEAN_SERVICE_CONDITIONS, true)
          toast.success(
            "3-bath ultrasonic wash, double rinse, and warm air dry complete."
          )
          if (
            phase !== "show" &&
            currentStep?.action === "ultrasonic_clean"
          ) {
            advanceStepSuccess("Completed 3-bath ultrasonic cleaning cycle")
          }
        }}
      />

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
        onWindFull={() => {
          horologyAudio.playToolFoley("screw")
          setMainspringLetDown(false)
          setInstalledParts((prev) => new Set(prev).add("mainspring_power"))
          sim.setWindFraction(1.0)
          toast.success("Mainspring wound to 100% (46-hour reserve).")
        }}
        onSkipTwoWeeks={() => {
          setConditions((prev) => {
            const next = { ...prev, daysElapsed: prev.daysElapsed + 14 }
            sim.setServiceConditions(next, true)
            return next
          })
          toast.message(
            conditions.overOiledFactor > 0.3
              ? "14 days elapsed: excess oil crept out of the jewel sink and fouled the hairspring."
              : "14 days elapsed: clean 60% meniscus held fast inside the ruby sink."
          )
        }}
        daysElapsed={conditions.daysElapsed}
        magnetized={conditions.magnetizedFactor}
        onDemagnetize={() => {
          horologyAudio.playToolFoley("demag")
          setConditions((prev) => {
            const next = { ...prev, magnetizedFactor: 0 }
            sim.setServiceConditions(next, true)
            return next
          })
          toast.success("Movement demagnetized: coils oscillating freely.")
          if (phase !== "show" && currentStep?.action === "demagnetize") {
            advanceStepSuccess("Cleared magnetization via tunnel coil")
          }
        }}
        onClearTrace={sim.clearTrace}
      />
    </div>
  )
}
