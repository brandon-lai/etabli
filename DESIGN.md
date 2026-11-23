---
version: alpha
name: etabli
description: Jura horological bench mat, studio macro optics, and ETA technical-communication sheet system for 1:1 mechanical watchmaking apprenticeship.
colors:
  primary: "oklch(0.755 0.125 82)"
  primary-ink: "oklch(0.165 0.018 175)"
  secondary: "oklch(0.228 0.016 175)"
  tertiary: "oklch(0.505 0.192 18)"
  blued-steel: "oklch(0.585 0.165 254)"
  bench-canvas: "oklch(0.152 0.014 174)"
  bench-mat: "oklch(0.215 0.028 168)"
  panel-translucent: "oklch(0.192 0.014 176)"
  ink-bright: "oklch(0.952 0.008 92)"
  ink-muted: "oklch(0.735 0.014 172)"
  border-hairline: "oklch(0.285 0.016 175)"
  border-input: "oklch(0.355 0.018 175)"
  danger: "oklch(0.505 0.192 25)"
  daylight-paper: "oklch(0.958 0.009 92)"
  daylight-card: "oklch(0.982 0.006 92)"
  daylight-ink: "oklch(0.198 0.016 215)"
  daylight-primary: "oklch(0.485 0.124 78)"
typography:
  display-hero:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: -0.028em
  title-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.02em
  title-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.28
    letterSpacing: -0.012em
  master-subtitle:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.52
    letterSpacing: -0.005em
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: 0em
  label-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.38
    letterSpacing: 0em
  caption-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: 0em
  timegrapher-readout:
    fontFamily: "SF Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
    fontFeature: "'tnum' 1"
  caliber-spec:
    fontFamily: "SF Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
    fontFeature: "'tnum' 1"
rounded:
  xs: 6px
  sm: 10px
  md: 14px
  lg: 20px
  xl: 28px
  full: 999px
spacing:
  2xs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  3xl: 96px
  4xl: 144px
components:
  bench-shell:
    backgroundColor: "{colors.bench-canvas}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.body-md}"
    padding: "{spacing.lg}"
  esd-mat-surface:
    backgroundColor: "{colors.bench-mat}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.xl}"
    padding: "{spacing.2xl}"
  hud-panel:
    backgroundColor: "{colors.panel-translucent}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.base}"
  primary-cta:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  tool-pill:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caliber-spec}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  subtitle-banner:
    backgroundColor: "{colors.panel-translucent}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.master-subtitle}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  timegrapher-strip:
    backgroundColor: "{colors.bench-canvas}"
    textColor: "{colors.blued-steel}"
    typography: "{typography.timegrapher-readout}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  jewel-indicator:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.xs}"
  fault-badge:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.2xs}"
  hairline-frame:
    backgroundColor: "{colors.border-hairline}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.title-md}"
    padding: "{spacing.3xl}"
  input-frame:
    backgroundColor: "{colors.border-input}"
    textColor: "{colors.ink-bright}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.xs}"
    padding: "{spacing.xs}"
  daylight-sheet:
    backgroundColor: "{colors.daylight-paper}"
    textColor: "{colors.daylight-ink}"
    typography: "{typography.display-hero}"
    padding: "{spacing.4xl}"
  daylight-slip:
    backgroundColor: "{colors.daylight-card}"
    textColor: "{colors.daylight-primary}"
    typography: "{typography.caliber-spec}"
    rounded: "{rounded.sm}"
    padding: "{spacing.base}"
---

# Établi Design Direction

## 1. Surface Modes & Physical Scene

- **Home (`/`) — *Experience + Persuade*:** A real-time macro Unitas / ETA 6497-1 pocket-watch movement turns slowly under a hooded 4200K Waldmann bench lamp on a muted Bergeon 7808 sage-slate mat. One primary call to action sits cleanly in view: **Begin your apprenticeship**.
- **Bench (`/bench`) & Explore (`/explore`) — *Experience + Operate*:** The movement under the loupe *is* the screen (`100dvh` full-bleed canvas). Tool racks, the lidded 6-compartment parts dome, the Part Inspector, and the slide-up Witschi-style acoustic Timegrapher tuck cleanly to the edges and recede while a tool is active.
- **Course Map (`/course`) & Assessment — *Operate + Read*:** Structured like an ETA *Communication Technique* specification sheet and Horological Society of New York bench ledger—vertical 11-lesson progression, Master Henri Delacroix's dry one-line note on your last attempt, and the 20-question pre/post horological exam.

**Scene sentence:** *An apprentice works under a hooded 4200K bench lamp in a quiet Le Locle workshop at dusk: surrounding surfaces stay low-reflectance mineral slate-green (`oklch(0.152 0.014 174)`) so glare never washes out mirror-polished steel bevels, while gilded CuZn37 wheels, synthetic Verneuil rubies, and 295°C cornflower heat-blued screws carry the color.*

## 2. World Vocabulary & Mirror Test

Watch-themed interfaces routinely fall into two traps: gold-on-black luxury perfume clichés (serif display type, tracked-caps labels) or steampunk brass gears bolted onto UI borders. Établi draws strictly from the working horologist's bench:

1. **Bergeon 7808 anti-static elastomer mat** — muted mineral sage-slate (`hue ~168–176`), resting the eye during multi-hour work.
2. **Rhodium-plated brass bridges with *Côtes de Genève* & mainplate *perlage*** — directional anisotropic sheen, never flat grey plastic.
3. **295°C tempered steel screws & synthetic ruby jewels** — cornflower blue (`oklch(0.585 0.165 254)`) and crimson corundum (`oklch(0.565 0.195 18)`) used sparingly as semantic markers for oil sinks, escapement events, and precision callouts.
4. **Bell-covered 6-section parts tray** — physical compartments numbered `1`–`6` holding parts in strict disassembly order.
5. **Witschi Watch Expert acoustic timegrapher** — scrolling dot trace plus three tabular numbers (`Rate s/d`, `Amplitude °`, `Beat error ms`) and nothing decorative.

## 3. Typography, Motion & Deliberate Rules

- **Typography:** System UI stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`) per the PRD's UI restraint principle, paired with `SF Mono` (`tabular-nums`) exclusively for caliber dimensions, tooth counts, torque curves, and timegrapher telemetry. Fluid hero scale uses `clamp(2.25rem, 4vw, 3rem)` (`48px` max recorded in YAML front matter).
- **Motion:** Spring-settled custom curves (`--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`). Tool selection and keyboard shortcuts (`1`–`9`, `Space` loupe, `Z` rewind, `Shift` wrist brace) respond immediately with zero animation latency. Under `prefers-reduced-motion: reduce`, UI transitions settle immediately and camera orbits pause unless scrubbed manually.
- **Linter notes:** Gate 20 (Hallmark stamp) is external bookkeeping; Base UI `[data-starting-style]` / `[data-ending-style]` attributes and `<Dialog>` wrapper components (`ask-henri-dialog.tsx`, `parts-tray-dialog.tsx`, `timegrapher-drawer.tsx`) animate centered modal overlays cleanly via `DialogContent` + `DialogOverlay` (`200ms` enter / `150ms` exit) with CSS `@starting-style` and `motion-reduce` overrides. Deliberate slow-motion escapement inspection (`0.03×`–`1.0×` simulation time scale) is an interactive physics control on the canvas, not a CSS transition.
