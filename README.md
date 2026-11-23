# Établi

**Établi is a browser watchmaking simulator where a master watchmaker teaches you one-on-one at his bench to take apart, clean, oil, reassemble, and regulate real mechanical movements.**

Built around **Course 1: Unitas / ETA 6497-1** (16.5 lignes · 36.60 mm · 17 Verneuil ruby jewels · 18,000 vph / 2.5 Hz · 53-hour mainspring reserve), guided by Master Watchmaker **Henri Delacroix**.

Design direction, OKLCH token palette, typography, and motion craft rules are documented in **[`DESIGN.md`](./DESIGN.md)** (*Vallée de Joux Atelier*).

---

## What Is Included

- **Full-Bleed Interactive 3D Unitas 6497-1 Movement (`/`, `/bench`, `/explore`)**:
  - 20 horologically ordered assemblies with real ETA part numbers (`100` Mainplate through `301` Regulator Index & Curb Pins), *Côtes de Genève* striping, mirror-polished *anglage* bevels, *perlage* baseplate, spoked gilded brass gear train, crimson Verneuil ruby jewels in gold chatons, Incabloc lyre shock springs, blued steel screws (including the left-hand-threaded crown wheel screw `420` with three-slot head), and metallic Nivarox flat-ribbon hairspring.
  - Automatic graceful fallback to an interactive **2D Technical Horological Blueprint** (`ETA 6497-1`) on devices without WebGL2.
- **10 kHz WebAssembly Horology Physics Engine (`sim/wasm/horology.as.ts` → `public/wasm/horology.wasm`)**:
  - Runs at a fixed 10,000 Hz timestep inside a dedicated Web Worker (`public/workers/sim-worker.js`) with a synchronous TypeScript mirror (`lib/horology/physics.ts`).
  - Models Hooke's law hairspring torque, Swiss lever escapement unlock (`0°–1.8°`) and impulse (`1.8°–7.5°`) zones, Moebius lubrication state (`9010`, `9415`, `HP-1300`, `8200`), 6-position gravity poise (`DU`, `DD`, `CU`, `CD`, `CL`, `CR`), regulator curb-pin rate (`s/d`), and movable stud carrier beat error (`ms`).
- **Four-Phase Apprenticeship Pedagogy (`/bench`)**:
  - **1. Show** → **2. Guide** → **3. Solo** → **4. Debrief** across all 7 Course 1 lessons (`L1` First Look & Let-Down through `L7` Six-Position Regulation), plus **"Master finishes"** skip for previously passed Solo lessons.
  - Enforces physical assembly preconditions, exact Bergeon screwdriver blade widths (`0.80 mm`, `1.20 mm`, `1.60 mm`), wrist bracing (`Shift`), left-hand unscrew direction (`R` on ETA `420`), Moebius oil selection & meniscus dosage, and compartmented dust-covered parts tray (`P`).
- **Slide-Up Witschi Acoustic Timegrapher Ribbon (`T` on `/bench`)**:
  - Live `var(--blued-steel)` rising/falling acoustic dot trace over the running movement with daily rate (`s/d`), balance amplitude (`°`), beat error (`ms`), lift angle `44°`, 6-position cradle selector, and live regulator/stud micrometric sliders.
- **Synthesized 18,000 vph Escapement Foley (`lib/horology/audio-engine.ts`)**:
  - Procedural Web Audio three-part Swiss lever tick (*unlock*, *pallet impulse*, *escape tooth lock* separated by millisecond intervals) plus screw torque clicks, Rodico thuds, and ultrasonic rinse harmonics.
- **Curriculum Grounding & 20-Question Pre/Post Horology Exam (`/course` & Ask Henri)**:
  - Retrieval-only **Ask Henri** bench reference strictly bounded to reviewed ETA 6497-1 technical sheets and Moebius charts (refuses unverified calibers rather than hallucinating).
  - 20-question pre/post horology diagnostic stored locally to measure learning delta per PRD §3.
- **Zero-Config Deterministic Mode + Force-RLS PostgreSQL Schema**:
  - Runs completely with zero environment variables configured (`hasDatabase() === false` serves deterministic seeded bench calibration data on `GET /api/telemetry` and refuses writes cleanly with `503` while saving progress locally in IndexedDB).
  - Includes `supabase/migrations/20261115000000_init.sql` (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` on all tables, integer tenths/cents columns, zero raw IP storage) and HMAC-SHA256 replay-safe advisor sign-off webhook (`POST /api/webhooks/advisor-signoff`).

---

## PRD Open Questions — Shipped Decisions & Reasoning

Every open question in PRD §14 (Pages 20 & 24–25) was resolved deliberately for V1:

1. **Business model: free Course 1 with paid courses, a one-time purchase, or free with sponsorship from a watch brand or school?**
   - **Decision:** **Free Course 1 (Unitas / ETA 6497-1) in full, with Courses 2–7 structured as standalone paid caliber modules (plus institutional licensing for horology schools).**
   - **Reasoning:** Watchmaking has a steep trust barrier—learners will not pay upfront before feeling whether browser tool-handling and escapement regulation are genuinely rigorous rather than a toy puzzle. Giving away the entire 6497-1 apprenticeship builds organic word-of-mouth in watch communities while matching how real horology schools (such as HSNY) use the 6497 as the universal introductory gateway before complication courses.

2. **Is the master fictional with a real advisor, or a real, named watchmaker?**
   - **Decision:** **Fictional master (*Henri Delacroix*, Vallée de Joux bench master) backed by per-lesson advisor sign-off records and primary technical citations.**
   - **Reasoning:** A fictional master lets us edit pedagogy, pacing, and multilingual phrasing freely without putting unscripted words in a real living watchmaker's mouth or tying the product's longevity to a single personality right, while `advisor_lesson_reviews` and per-lesson technical citations (`ETA 6497-1 Technical Communication`, `Moebius Technical Guide`) keep every mechanical rule accountable to real watchmakers.

3. **Should there be an "ask the master" chat? If so, answers must come only from the reviewed curriculum, since an unsupported answer breaks the accuracy promise.**
   - **Decision:** **Yes — shipped as a deterministic, citation-locked bench reference (`Ask Henri`), never an open-ended generative LLM.**
   - **Reasoning:** An unconstrained LLM will inevitably confuse a Unitas 6497-1 (`44°` lift angle, dry pallet jewels in vintage practice vs. Moebius `9415` epilame, left-hand crown wheel screw `420`) with unrelated calibers. Our `Ask Henri` dialog matches apprentice questions exclusively against reviewed Course 1 entries and cites the exact ETA/Moebius document—explicitly refusing out-of-curriculum questions when no verified entry matches.

4. **Accounts and cross-device saves: needed for v1, or local saves only?**
   - **Decision:** **Local-first IndexedDB saves (`etabli_dossier_v1` with `localStorage` fallback) + offline Service Worker caching for V1; zero mandatory account wall.**
   - **Reasoning:** Requiring sign-up before touching the mainspring let-down directly violates PRD §5's core promise (*"No sign-up before Course 1"*). Local IndexedDB persistence gives instant zero-friction continuity across lessons and offline return visits, while the database layer is reserved for anonymous cohort telemetry and signed advisor review records until Course 2 paid entitlements introduce optional accounts.

5. **iPad with Pencil in Phase 3, or earlier given how well pen input fits the work?**
   - **Decision:** **Supported immediately in V1 via unified `PointerEvents` (`pointerType === "pen" | "touch" | "mouse"`), responsive `768px`/`390px` bench chrome, and `44px` coarse-pointer hit targets.**
   - **Reasoning:** Screwdrivers, Rodico dressing, and oiler meniscus placement map naturally to Apple Pencil on an iPad Pro resting flat like a bench mat. Supporting Pointer Events and tablet-first edge chrome from day one costs far less than retrofitting mouse-only assumptions in Phase 3.

6. **Final name.**
   - **Decision:** **Établi** (`etabli`).
   - **Reasoning:** *Établi* is the French horological term for the watchmaker's high-armrest workbench itself. It is short, memorable, unmistakably tied to Swiss/French craft heritage without colliding with generic Steam "Simulator" titles, and frames the URL and browser tab as a place you sit down to work.

---

## Local Development

```bash
npm install
npm run build:wasm   # Compiles AssemblyScript 10 kHz solver -> public/wasm/horology.wasm
npm run dev          # Starts Next.js on http://localhost:3000
```

### Verification & Tests

```bash
npm run typecheck    # Strict TypeScript check
npm test             # Physics solver, dependency graph, live Postgres Force-RLS & HMAC webhook suite
npm run build        # Production Next.js build
```

### Environment Variables (Optional)

Copy `.env.example` to `.env.local` if connecting a PostgreSQL / Supabase database (`:6543` transaction pooler supported via `{ prepare: false }`). Without `DATABASE_URL`, every route operates deterministically in local IndexedDB + seeded calibration mode.

