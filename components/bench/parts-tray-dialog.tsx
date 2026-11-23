"use client"

import { Droplets, Sparkles, Wrench } from "lucide-react"
import {
  CALIBER_6497_PARTS,
  type CaliberPartSpec,
} from "@/lib/horology/caliber6497"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const COMPARTMENT_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "1. Case, Stem & Click",
  2: "2. Enamel Dial, Hands & Motion",
  3: "3. Balance (Inverted) & Pallet",
  4: "4. Going Train & Bridge",
  5: "5. Barrel, Bridge & Center",
  6: "6. Keyless Works & Mainplate",
}

export function PartsTrayDialog({
  open,
  onOpenChange,
  installedParts,
  cleanedInUltrasonic,
  onInstallFromTray,
  onInspectPart,
  onRunUltrasonicClean,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  installedParts: ReadonlySet<string>
  cleanedInUltrasonic: boolean
  onInstallFromTray: (partId: string) => void
  onInspectPart: (partId: string) => void
  onRunUltrasonicClean: () => void
}) {
  const removedParts = CALIBER_6497_PARTS.filter(
    (p) => !installedParts.has(p.id) && p.id !== "mainspring_power"
  )

  const byCompartment = new Map<1 | 2 | 3 | 4 | 5 | 6, CaliberPartSpec[]>()
  for (const c of [1, 2, 3, 4, 5, 6] as const) {
    byCompartment.set(
      c,
      removedParts.filter((p) => p.trayCompartment === c)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86dvh] max-w-3xl overflow-y-auto overscroll-contain">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div>
              <DialogTitle>6-Compartment Horological Dust-Cover Tray</DialogTitle>
              <DialogDescription>
                Removed assemblies sit under an acrylic bell sorted by sub-assembly
                so bridge screws and delicate pivots never mix.
              </DialogDescription>
            </div>
            <Button
              variant={cleanedInUltrasonic ? "secondary" : "default"}
              size="sm"
              onClick={onRunUltrasonicClean}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {cleanedInUltrasonic
                ? "3-Bath Ultrasonic Clean Complete"
                : "Run 3-Bath Ultrasonic Clean"}
            </Button>
          </div>
        </DialogHeader>

        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {([1, 2, 3, 4, 5, 6] as const).map((comp) => {
            const items = byCompartment.get(comp) ?? []
            return (
              <section key={comp} className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-foreground">
                    {COMPARTMENT_LABELS[comp]}
                  </h3>
                  <Badge variant="outline" className="font-mono tabular-nums">
                    {items.length} {items.length === 1 ? "part" : "parts"}
                  </Badge>
                </div>

                {items.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Compartment empty: assemblies mounted on the mainplate.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border border-t border-border">
                    {items.map((part) => (
                      <li
                        key={part.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {part.name}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {part.etaNumber}
                            {part.screwBladeMm
                              ? `, ${part.screwBladeMm.toFixed(2)} mm slot`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onInspectPart(part.id)
                              onOpenChange(false)
                            }}
                          >
                            Inspect
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onInstallFromTray(part.id)}
                          >
                            <Wrench className="size-3.5" aria-hidden="true" />
                            Mount
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {comp === 3 ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Droplets className="size-3 shrink-0" aria-hidden="true" />
                    <span>
                      Balance cock stored inverted so Nivarox coils hang free.
                    </span>
                  </p>
                ) : null}
              </section>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
