"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { HelpCircle, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AskHenriDialog } from "@/components/bench/ask-henri-dialog"
import { cn } from "@/lib/utils"

export function SiteHeader({
  compact = false,
  floating = false,
}: {
  compact?: boolean
  floating?: boolean
}) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [henriOpen, setHenriOpen] = useState(false)

  const navItems = [
    { href: "/bench", label: "Bench", mobileLabel: "Bench" },
    { href: "/course", label: "Course 1", mobileLabel: "Course 1" },
    { href: "/explore", label: "Explore 6497", mobileLabel: "Explore" },
  ]

  return (
    <>
      <header
        className={cn(
          "z-30",
          floating
            ? "pointer-events-none absolute inset-x-0 top-0 px-3 py-2 sm:px-5"
            : cn(
                "sticky top-0 border-b border-border bg-background",
                compact ? "px-3 py-1.5" : "px-4 py-2 sm:px-6"
              )
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-2",
            floating ? "max-w-none" : "max-w-7xl"
          )}
        >
          <div className="pointer-events-auto flex shrink-0 items-center gap-2.5">
            <Link
              href="/"
              aria-label="Établi home"
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-1 text-foreground transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                floating
                  ? "border border-border bg-card hover:bg-secondary"
                  : "hover:bg-secondary"
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-[var(--bench-mat)]"
              >
                <span className="size-1.5 rounded-full bg-[var(--ruby)]" />
              </span>
              <span className="hidden text-sm font-semibold tracking-tight min-[440px]:inline sm:text-base">
                Établi
              </span>
            </Link>
            {!floating ? (
              <span className="hidden text-xs tabular-nums text-muted-foreground lg:inline-block">
                ETA <span className="font-mono">6497-1</span>,{" "}
                <span className="font-mono">18,000</span> vph
              </span>
            ) : null}
          </div>

          <nav
            aria-label="Primary"
            className={cn(
              "pointer-events-auto flex items-center gap-0.5 rounded-lg p-0.5",
              floating ? "border border-border bg-card" : ""
            )}
          >
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none sm:px-3 sm:text-sm",
                    active
                      ? "bg-secondary text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div
            className={cn(
              "pointer-events-auto flex shrink-0 items-center gap-1",
              floating ? "rounded-lg border border-border bg-card p-0.5" : ""
            )}
          >
            <Button
              variant={floating ? "ghost" : "outline"}
              size="sm"
              onClick={() => setHenriOpen(true)}
              aria-label="Ask Master Henri technical lookup"
              className="min-h-11 px-2.5"
            >
              <HelpCircle className="size-4" aria-hidden="true" />
              <span className="hidden md:inline">Ask Henri</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Switch between Swiss daylight and dusk bench lamp"
              className="size-11"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun
                className="size-4 rotate-0 scale-100 transition-transform duration-150 dark:-rotate-90 dark:scale-0"
                aria-hidden="true"
              />
              <Moon
                className="absolute size-4 rotate-90 scale-0 transition-transform duration-150 dark:rotate-0 dark:scale-100"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </header>

      <AskHenriDialog open={henriOpen} onOpenChange={setHenriOpen} />
    </>
  )
}
