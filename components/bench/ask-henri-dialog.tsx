"use client"

import { useState } from "react"
import { BookMarked, Search } from "lucide-react"
import { ASK_HENRI_CORPUS, queryAskHenri } from "@/lib/horology/course1"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function AskHenriDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState("")
  const result = queryAskHenri(query)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Ask Master Henri: Cited Bench Reference</DialogTitle>
          <DialogDescription>
            Answers come exclusively from advisor-reviewed ETA 6497-1 technical
            sheets, Moebius lubrication charts, Daniels, De Carle, and Fried:
            never unverified generated text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. left-hand screw, Moebius 9010, beat error, magnetism…"
              aria-label="Search cited horological reference cards"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ASK_HENRI_CORPUS.map((card) => (
              <Button
                key={card.id}
                variant="secondary"
                size="sm"
                onClick={() => setQuery(card.topic)}
              >
                {card.topic}
              </Button>
            ))}
          </div>

          {result.matched ? (
            <div className="divide-y divide-border border-t border-border">
              {result.cards.map((card) => (
                <article key={card.id} className="py-3.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {card.questionPrompt}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {card.answer}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <BookMarked className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{card.citation}</span>
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="border-t border-border pt-3.5 text-sm text-muted-foreground">
              {result.refusalNote}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
