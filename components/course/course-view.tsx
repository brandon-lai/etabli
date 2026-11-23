"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Award, CheckCircle2, ClipboardCheck, Clock } from "lucide-react"
import {
  DEFAULT_DOSSIER_STATE,
  loadBenchDossier,
  saveBenchDossier,
  type BenchDossierState,
} from "@/lib/bench-storage"
import {
  COURSE_1_LESSONS,
  FULL_CURRICULUM_ROADMAP,
  HOROLOGY_20_QUIZ,
} from "@/lib/horology/course1"
import type { TelemetryRunRow } from "@/lib/seeded-telemetry"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CourseView({
  initialTelemetryRows: _initialTelemetryRows,
  storageMode: _storageMode,
}: {
  initialTelemetryRows: TelemetryRunRow[]
  storageMode: "postgres" | "deterministic-seed"
}) {
  const [dossier, setDossier] = useState<BenchDossierState>(DEFAULT_DOSSIER_STATE)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizStage, setQuizStage] = useState<"pre" | "post">("pre")
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submittedResult, setSubmittedResult] = useState<{
    score: number
    total: number
  } | null>(null)

  useEffect(() => {
    void loadBenchDossier().then(setDossier)
  }, [])

  const completedEntries = Object.values(dossier.completedLessons).filter(
    (c) => c.soloPassed
  )
  const completedCount = completedEntries.length

  const openQuiz = (stage: "pre" | "post") => {
    setQuizStage(stage)
    setAnswers({})
    setSubmittedResult(null)
    setQuizOpen(true)
  }

  const handleSubmitQuiz = async () => {
    let correct = 0
    for (const q of HOROLOGY_20_QUIZ) {
      if (answers[q.id] === q.correctIndex) correct += 1
    }
    setSubmittedResult({ score: correct, total: HOROLOGY_20_QUIZ.length })

    const nextDossier: BenchDossierState = {
      ...dossier,
      preQuizScore: quizStage === "pre" ? correct : dossier.preQuizScore,
      postQuizScore: quizStage === "post" ? correct : dossier.postQuizScore,
      updatedAtIso: new Date().toISOString(),
    }
    setDossier(nextDossier)
    await saveBenchDossier(nextDossier)

    void fetch("/api/quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stage: quizStage,
        score: correct,
        total: HOROLOGY_20_QUIZ.length,
        answers,
      }),
    }).catch(() => {})

    toast.success(
      `${quizStage === "pre" ? "Pre-course" : "Post-course"} horology score recorded: ${correct}/${HOROLOGY_20_QUIZ.length}`
    )
  }

  const gainDelta =
    dossier.preQuizScore !== null && dossier.postQuizScore !== null
      ? dossier.postQuizScore - dossier.preQuizScore
      : null

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 lg:py-12">
        {/* Top Course Header & Flat Apprentice Record (single primary CTA on screen) */}
        <section className="grid grid-cols-1 gap-8 border-b border-border pb-10 lg:grid-cols-12 lg:items-end">
          <div className="space-y-3 lg:col-span-7">
            <p className="text-xs tabular-nums text-muted-foreground">
              Calibre ETA / Unitas <span className="font-mono">6497-1</span>,{" "}
              <span className="font-mono">17</span> synthetic rubies,{" "}
              <span className="font-mono">18,000</span> vph
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Course 1: Full Pocket-Watch Service
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Eleven workshop lessons with Master Henri Delacroix. Every lesson
              moves from demonstration (<strong className="text-foreground">Show</strong>) to
              assisted bench work (<strong className="text-foreground">Guide</strong>),
              unguided qualification (<strong className="text-foreground">Solo</strong>),
              and a six-position timegrapher critique (<strong className="text-foreground">Debrief</strong>).
            </p>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <dl className="grid grid-cols-3 divide-x divide-border border-y border-border py-3">
              <div className="pr-3">
                <dt className="text-xs text-muted-foreground">Solo Qualified</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                  {completedCount}/11
                </dd>
              </div>
              <div className="px-3">
                <dt className="text-xs text-muted-foreground">Pre-Quiz</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                  {dossier.preQuizScore !== null
                    ? `${dossier.preQuizScore}/20`
                    : "Not taken"}
                </dd>
              </div>
              <div className="pl-3">
                <dt className="text-xs text-muted-foreground">Post Gain</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                  {gainDelta !== null
                    ? `${gainDelta >= 0 ? "+" : ""}${gainDelta}`
                    : dossier.postQuizScore !== null
                      ? `${dossier.postQuizScore}/20`
                      : "Pending"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                nativeButton={false}
                render={<Link href={`/bench?lesson=${dossier.activeLessonId}`} />}
              >
                {completedCount > 0 ? "Continue on Bench" : "Begin Lesson 1 on Bench"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openQuiz("pre")}>
                <ClipboardCheck className="size-3.5" aria-hidden="true" />
                Pre-Quiz (20)
              </Button>
              <Button size="sm" variant="outline" onClick={() => openQuiz("post")}>
                <Award className="size-3.5" aria-hidden="true" />
                Post-Quiz (20)
              </Button>
            </div>
          </div>
        </section>

        {/* 11-Lesson Syllabus Ledger (outline actions so only top CTA is filled brass) */}
        <section aria-labelledby="syllabus-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="syllabus-heading"
              className="text-xl font-semibold text-foreground"
            >
              Course 1 Bench Syllabus
            </h2>
            <p className="text-xs text-muted-foreground">
              Any lesson can be opened directly; Henri prepares the movement
              state on the mat.
            </p>
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {COURSE_1_LESSONS.map((lesson) => {
              const rec = dossier.completedLessons[lesson.id]
              const isPassed = Boolean(rec?.soloPassed)
              const isCurrent = lesson.id === dossier.activeLessonId
              return (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-4 p-4 transition-colors duration-150 hover:bg-secondary/35 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Lesson{" "}
                        <span className="font-mono text-primary">
                          {String(lesson.number).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden="true" />
                        {lesson.durationMinutes} min
                      </span>
                      {isPassed ? (
                        <Badge variant="secondary">
                          <CheckCircle2
                            className="size-3 text-primary"
                            aria-hidden="true"
                          />
                          Solo Qualified
                        </Badge>
                      ) : isCurrent ? (
                        <Badge variant="outline">Current Bench</Badge>
                      ) : null}
                    </div>

                    <h3 className="text-base font-semibold text-foreground sm:text-lg">
                      {lesson.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {lesson.subtitle}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Henri&apos;s note:
                      </span>{" "}
                      {lesson.henriBenchNote}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {rec ? (
                      <div className="hidden text-right text-xs tabular-nums sm:block">
                        <p className="text-[var(--blued-steel)]">
                          <span className="font-mono">
                            {rec.bestAmplitudeDeg}°
                          </span>
                          ,{" "}
                          <span className="font-mono">
                            {rec.bestRateSecPerDay >= 0 ? "+" : ""}
                            {rec.bestRateSecPerDay}
                          </span>{" "}
                          s/d
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-mono">{rec.slipsCount}</span>{" "}
                          slips
                        </p>
                      </div>
                    ) : null}

                    <Button
                      variant={isCurrent && !isPassed ? "secondary" : "outline"}
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/bench?lesson=${lesson.id}`} />}
                    >
                      {isPassed
                        ? "Re-run Lesson"
                        : isCurrent
                          ? "At the Bench"
                          : "Open Lesson"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Five-Phase Horological Curriculum Roadmap */}
        <section aria-labelledby="roadmap-heading" className="space-y-4">
          <div className="space-y-1">
            <h2
              id="roadmap-heading"
              className="text-xl font-semibold text-foreground"
            >
              Five-Phase Apprenticeship Architecture
            </h2>
            <p className="text-sm text-muted-foreground">
              V1 ships Course 1 (ETA 6497-1 manual-wind service) end-to-end;
              later courses extend the same 10 kHz physics and rigid-body core.
            </p>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {FULL_CURRICULUM_ROADMAP.map((item) => (
              <div
                key={item.phase}
                className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-3">
                  <span className="text-xs font-medium text-primary">
                    {item.phase}
                  </span>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                </div>
                <div className="font-mono text-xs text-muted-foreground sm:col-span-3">
                  {item.caliber}
                </div>
                <p className="text-sm text-muted-foreground sm:col-span-4">
                  {item.focus}
                </p>
                <div className="sm:col-span-2 sm:text-right">
                  <Badge
                    variant={
                      item.status === "playable_v1" ? "secondary" : "outline"
                    }
                  >
                    {item.status === "playable_v1"
                      ? `Playable in V1 (${item.lessonsCount}L)`
                      : `Planned (${item.lessonsCount}L)`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Apprentice's Personal Bench Qualification Log (zero fabricated cohort numbers) */}
        <section aria-labelledby="notebook-heading" className="space-y-4">
          <div className="space-y-1">
            <h2
              id="notebook-heading"
              className="text-xl font-semibold text-foreground"
            >
              Your Bench Qualification Notebook
            </h2>
            <p className="text-xs text-muted-foreground">
              Every Solo pass records your live 10 kHz Dial-Up amplitude, daily
              rate, beat error, and slip count locally on this device.
            </p>
          </div>

          {completedEntries.length === 0 ? (
            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  No Solo qualifications recorded yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Complete Show, Guide, and Solo on Lesson 1 to sign your first
                  6497-1 timegrapher entry into this notebook.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/bench?lesson=c1-l01" />}
              >
                Open Lesson 01
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium text-foreground">
                      Lesson
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-medium text-foreground">
                      Amplitude
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-medium text-foreground">
                      Daily Rate
                    </th>
                    <th className="hidden px-3.5 py-2.5 text-right font-medium text-foreground sm:table-cell">
                      Beat Error
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-medium text-foreground">
                      Slips
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {completedEntries.map((rec) => {
                    const spec = COURSE_1_LESSONS.find(
                      (l) => l.id === rec.lessonId
                    )
                    return (
                      <tr key={rec.lessonId}>
                        <td className="px-3.5 py-2.5 text-foreground">
                          {spec
                            ? `Lesson ${String(spec.number).padStart(2, "0")}: ${spec.title}`
                            : rec.lessonId}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-[var(--blued-steel)]">
                          {rec.bestAmplitudeDeg.toFixed(1)}°
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-[var(--blued-steel)]">
                          <span className="font-mono">
                            {rec.bestRateSecPerDay >= 0 ? "+" : ""}
                            {rec.bestRateSecPerDay.toFixed(1)}
                          </span>{" "}
                          s/d
                        </td>
                        <td className="hidden px-3.5 py-2.5 text-right text-foreground sm:table-cell">
                          <span className="font-mono">
                            {rec.bestBeatErrorMs.toFixed(2)}
                          </span>{" "}
                          ms
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                          {rec.slipsCount}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* 20-Question Horological Knowledge Assessment Dialog */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              20-Question ETA 6497-1 Knowledge Check (
              {quizStage === "pre" ? "Pre-Course Baseline" : "Post-Course Qualification"}
              )
            </DialogTitle>
            <DialogDescription>
              Covers gear-train order, Moebius lubrication points, dry escapement
              rules, left-hand threads, and Witschi timegrapher diagnosis.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] divide-y divide-border overflow-y-auto overscroll-contain pr-1">
            {HOROLOGY_20_QUIZ.map((q, idx) => (
              <fieldset key={q.id} className="space-y-2 py-4 first:pt-1">
                <legend className="text-sm font-medium text-foreground">
                  {idx + 1}. {q.question}
                </legend>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((choice, cIdx) => {
                    const picked = answers[q.id] === cIdx
                    const isRight =
                      submittedResult !== null && q.correctIndex === cIdx
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: cIdx }))
                        }
                        className={`min-h-10 rounded-lg border px-3 py-2 text-left text-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none ${
                          isRight
                            ? "border-primary bg-primary/15 font-semibold text-foreground"
                            : picked
                              ? "border-primary bg-secondary text-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {choice}
                      </button>
                    )
                  })}
                </div>
                {submittedResult !== null ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Explanation:
                    </span>{" "}
                    {q.explanation}
                  </p>
                ) : null}
              </fieldset>
            ))}
          </div>

          <DialogFooter className="items-center justify-between">
            <span className="text-xs tabular-nums text-muted-foreground">
              Answered{" "}
              <span className="font-mono">
                {Object.keys(answers).length}/{HOROLOGY_20_QUIZ.length}
              </span>
              {submittedResult
                ? `, Score: ${submittedResult.score}/${submittedResult.total}`
                : ""}
            </span>
            <Button onClick={handleSubmitQuiz}>
              Grade & Record {quizStage === "pre" ? "Pre-Quiz" : "Post-Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
