// Complete 17-Jewel Unitas / ETA 6497-1 Part Catalog & Physical Dependency Graph
// Order of operations emerges strictly from physical blocking (blockedByForRemoval /
// requiresInstalledForMount), never from a hardcoded linear script.

export type BenchToolId =
  | "tweezers"
  | "screwdriver_080"
  | "screwdriver_100"
  | "screwdriver_120"
  | "screwdriver_140"
  | "pegwood"
  | "rodico"
  | "oiler"
  | "hand_levers"
  | "hand_press"
  | "case_knife"
  | "loupe"
  | "blower"
  | "demagnetizer"

export type LubricantId =
  | "none"
  | "moebius_9010"
  | "moebius_hp1300"
  | "moebius_9415"
  | "moebius_8200"
  | "moebius_9501"

export type MovementSide = "movement" | "dial"

export interface BenchToolSpec {
  id: BenchToolId
  name: string
  shortLabel: string
  bladeWidthMm?: number
  colorCode?: string
  hotkey: string
  purpose: string
}

export interface LubricantSpec {
  id: LubricantId
  name: string
  viscosityNote: string
  whereUsed: string
}

export interface CaliberPartSpec {
  id: string
  etaNumber: string
  name: string
  frenchTerm: string
  subsystem:
    | "casing"
    | "indication"
    | "escapement"
    | "going_train"
    | "power_barrel"
    | "keyless_works"
    | "foundation"
  side: MovementSide
  material: string
  finish: string
  jewelCount: number
  toothOrLeafCount?: string
  screwCount: number
  screwBladeMm?: number
  leftHandThreadNote?: string
  removalTool: BenchToolId
  installTool: BenchToolId
  requiredLubricant: LubricantId
  mustStayDryWarning?: string
  trayCompartment: 1 | 2 | 3 | 4 | 5 | 6
  explodeZ: number
  anchor: [number, number, number]
  /** Parts that physically cover or lock this part, preventing removal while installed */
  blockedByForRemoval: string[]
  /** Parts that must already sit on the mainplate before this part can be mounted */
  requiresInstalledForMount: string[]
  /** Requires mainspring to be let down before removal, otherwise train recoils violently */
  requiresMainspringLetDown?: boolean
  /** Spring under tension that will launch across the room if unbraced with pegwood/tweezers */
  highLaunchRisk?: boolean
  plainFunction: string
  inspectionCue: string
  citation: string
}

export const BENCH_TOOLS: readonly BenchToolSpec[] = [
  {
    id: "tweezers",
    name: "Brass & Dumont No. 3 Tweezers",
    shortLabel: "Tweezers",
    hotkey: "1",
    purpose: "Lift bridges, wheels, pallet fork, and balance cock by safe flats.",
  },
  {
    id: "screwdriver_080",
    name: "0.80 mm Screwdriver (Orange)",
    shortLabel: "0.80 mm",
    bladeWidthMm: 0.8,
    colorCode: "orange",
    hotkey: "2",
    purpose: "Dial-foot locking screws on the mainplate flank.",
  },
  {
    id: "screwdriver_100",
    name: "1.00 mm Screwdriver (Black)",
    shortLabel: "1.00 mm",
    bladeWidthMm: 1.0,
    colorCode: "black",
    hotkey: "3",
    purpose: "Pallet cock screws and hairspring stud fastening.",
  },
  {
    id: "screwdriver_120",
    name: "1.20 mm Screwdriver (Red)",
    shortLabel: "1.20 mm",
    bladeWidthMm: 1.2,
    colorCode: "red",
    hotkey: "4",
    purpose: "Balance cock, going-train bridge, and setting lever screw.",
  },
  {
    id: "screwdriver_140",
    name: "1.40 mm Screwdriver (Grey)",
    shortLabel: "1.40 mm",
    bladeWidthMm: 1.4,
    colorCode: "grey",
    hotkey: "5",
    purpose: "Barrel bridge, ratchet wheel, and left-hand crown wheel screw.",
  },
  {
    id: "pegwood",
    name: "Boxwood Pegwood",
    shortLabel: "Pegwood",
    hotkey: "6",
    purpose: "Control barrel let-down, steady bridges while seating pivots, peg jewel holes.",
  },
  {
    id: "rodico",
    name: "Bergeon Rodico Putty",
    shortLabel: "Rodico",
    hotkey: "7",
    purpose: "Dab excess oil, lift small screws safely, remove fingerprint residue.",
  },
  {
    id: "oiler",
    name: "Automatic Micro-Oiler (Fine Black / Red)",
    shortLabel: "Oiler",
    hotkey: "8",
    purpose: "Deposit measured Moebius oil drop into jewel oil sink (50–70% meniscus).",
  },
  {
    id: "hand_levers",
    name: "Polished Hand Levers + Dial Sheet",
    shortLabel: "Hand Levers",
    hotkey: "9",
    purpose: "Lift hour, minute, and 9H small-seconds hands evenly over dial protector.",
  },
  {
    id: "hand_press",
    name: "Nylon-Tipped Hand Press",
    shortLabel: "Hand Press",
    hotkey: "0",
    purpose: "Press hands level and parallel to the enamel dial with proper clearance.",
  },
  {
    id: "case_knife",
    name: "Horological Case Knife",
    shortLabel: "Case Knife",
    hotkey: "c",
    purpose: "Pop snap-back exhibition bezel cleanly at the 9H lip.",
  },
  {
    id: "blower",
    name: "Rubber Dust Blower",
    shortLabel: "Blower",
    hotkey: "b",
    purpose: "Clear lint and give the balance wheel a gentle air puff to test free swing.",
  },
  {
    id: "demagnetizer",
    name: "Tunnel Coil Demagnetizer",
    shortLabel: "Demag",
    hotkey: "m",
    purpose: "Decay alternating field to zero to clear clinging magnetized hairspring coils.",
  },
] as const

export const LUBRICANTS: readonly LubricantSpec[] = [
  {
    id: "none",
    name: "Leave Dry (No Lubricant)",
    viscosityNote: "Clean, dry degreased surface",
    whereUsed: "Escape wheel teeth, pallet fork pivots, hairspring coils, dial train.",
  },
  {
    id: "moebius_9010",
    name: "Moebius Synt-A-Lube 9010",
    viscosityNote: "Low-viscosity synthetic oil (150 cSt @ 20°C)",
    whereUsed: "Fast low-torque pivots: 3rd, 4th, escape wheel jewels & Incabloc capstones.",
  },
  {
    id: "moebius_hp1300",
    name: "Moebius Synt-HP 1300 (D5)",
    viscosityNote: "High-pressure synthetic oil (1260 cSt @ 20°C)",
    whereUsed: "High-torque slow pivots: barrel arbor bushings and center wheel pivots.",
  },
  {
    id: "moebius_9415",
    name: "Moebius 9415 Escapement Grease",
    viscosityNote: "Thixotropic epilame-friendly grease",
    whereUsed: "Pallet stone impulse planes (tiny trace transferred across every 3rd escape tooth).",
  },
  {
    id: "moebius_8200",
    name: "Moebius 8200 Mainspring Grease",
    viscosityNote: "Graphite-free high-load grease",
    whereUsed: "Mainspring blade leaves inside barrel drum.",
  },
  {
    id: "moebius_9501",
    name: "Moebius 9501 Keyless Grease",
    viscosityNote: "Adhesive steel-on-steel synthetic grease",
    whereUsed: "Winding stem square, sliding clutch, yoke groove, setting lever jumper.",
  },
] as const

export const CALIBER_6497_PARTS: readonly CaliberPartSpec[] = [
  {
    id: "case_back",
    etaNumber: "CASE-6497",
    name: "Exhibition Caseback",
    frenchTerm: "Fond de boîte vitré",
    subsystem: "casing",
    side: "movement",
    material: "316L Stainless Steel & Sapphire",
    finish: "Circular satin bezel, beveled lip at 9H",
    jewelCount: 0,
    screwCount: 0,
    removalTool: "case_knife",
    installTool: "hand_press",
    requiredLubricant: "none",
    trayCompartment: 1,
    explodeZ: 4.8,
    anchor: [0, 0, 2.2],
    blockedByForRemoval: [],
    requiresInstalledForMount: ["mainplate", "stem_crown"],
    plainFunction: "Seals the 16½-ligne movement against dust and moisture while exposing the bridges.",
    inspectionCue: "Locate the machined pry notch at 9 o'clock before inserting the case knife.",
    citation: "ETA 6497-1 Technical Communication — Casing & Joint Inspection",
  },
  {
    id: "mainspring_power",
    etaNumber: "CLICK-425",
    name: "Mainspring Stored Tension (Let-Down)",
    frenchTerm: "Désarmage du ressort-moteur",
    subsystem: "power_barrel",
    side: "movement",
    material: "Hardened Steel Click & Ratchet",
    finish: "Straight-grained steel click (425) & recoil spring (430)",
    jewelCount: 0,
    screwCount: 0,
    removalTool: "pegwood",
    installTool: "tweezers",
    requiredLubricant: "none",
    trayCompartment: 1,
    explodeZ: 3.9,
    anchor: [-4.8, 4.6, 1.5],
    blockedByForRemoval: ["case_back"],
    requiresInstalledForMount: ["barrel_bridge", "mainspring_barrel"],
    plainFunction:
      "Holds 46 hours of wound energy in the barrel. Must be controlled by thumb on crown while holding the click back.",
    inspectionCue:
      "Never lift the pallet cock or train bridge under wind — stored barrel torque will spin the train violently and shear pivots.",
    citation: "ETA 6497-1 Service Sheet §2.1; De Carle, Practical Watch Repairing, Ch. 3",
  },
  {
    id: "stem_crown",
    etaNumber: "ETA 401",
    name: "Winding Stem & Onion Crown",
    frenchTerm: "Tige de remontoir",
    subsystem: "keyless_works",
    side: "movement",
    material: "Tempered High-Carbon Steel",
    finish: "Turned pilot, milled square, fluted brass/steel crown",
    jewelCount: 0,
    screwCount: 1,
    screwBladeMm: 1.2,
    removalTool: "screwdriver_120",
    installTool: "tweezers",
    requiredLubricant: "moebius_9501",
    trayCompartment: 1,
    explodeZ: 2.0,
    anchor: [13.5, 0, 0.3],
    blockedByForRemoval: ["case_back"],
    requiresInstalledForMount: ["mainplate", "keyless_works"],
    plainFunction: "Couples manual winding and hand-setting via the sliding clutch and setting lever.",
    inspectionCue:
      "Loosen the setting lever screw exactly 1.5 turns — unscrewing it completely drops the setting lever inside the dial side.",
    citation: "ETA 6497-1 Technical Sheet — Note on Setting Lever Screw 5443 (max 1.5 turns)",
  },
  {
    id: "hands_set",
    etaNumber: "HANDS-6497",
    name: "Blued Poire Hands & 9H Small Seconds",
    frenchTerm: "Aiguilles heures, minutes et petite seconde",
    subsystem: "indication",
    side: "dial",
    material: "Flame-Blued Carbon Steel",
    finish: "290°C cornflower temper blue, specular boss",
    jewelCount: 0,
    screwCount: 0,
    removalTool: "hand_levers",
    installTool: "hand_press",
    requiredLubricant: "none",
    trayCompartment: 2,
    explodeZ: -4.4,
    anchor: [0, 0, -1.9],
    blockedByForRemoval: ["case_back"],
    requiresInstalledForMount: ["dial_plate"],
    plainFunction: "Displays hours, minutes, and continuous 1-rev/min fourth-wheel seconds at 9 o'clock.",
    inspectionCue: "Always slip a protective plastic dial sheet under both hand levers before prying upward.",
    citation: "Fried, The Watch Repairer's Manual — Dial & Hand Extraction",
  },
  {
    id: "dial_plate",
    etaNumber: "DIAL-6497",
    name: "Grand Feu White Enamel Dial",
    frenchTerm: "Cadran émail petite seconde à 9h",
    subsystem: "indication",
    side: "dial",
    material: "Vitreous Enamel on Copper Disk",
    finish: "Gloss fired white enamel, railroad chapter ring, recessed 9H subdial",
    jewelCount: 0,
    screwCount: 2,
    screwBladeMm: 0.8,
    removalTool: "screwdriver_080",
    installTool: "screwdriver_080",
    requiredLubricant: "none",
    trayCompartment: 2,
    explodeZ: -3.4,
    anchor: [0, 0, -1.3],
    blockedByForRemoval: ["hands_set"],
    requiresInstalledForMount: ["hour_wheel_cannon"],
    plainFunction: "Carries the chapter tracks anchored by two soldered copper dial feet locked in the mainplate.",
    inspectionCue: "Back off both 0.80 mm flank locking screws half a turn until the dial lifts without prying.",
    citation: "ETA 6497-1 Technical Sheet — Dial Fastening Screws (0.80 mm)",
  },
  {
    id: "hour_wheel_cannon",
    etaNumber: "ETA 255 / 242",
    name: "Hour Wheel, Foil Washer & Cannon Pinion",
    frenchTerm: "Roue des heures, clinquant et chaussée",
    subsystem: "indication",
    side: "dial",
    material: "Gilded Brass & Hardened Steel",
    finish: "Circular satin brass wheel (40t), polished steel cannon lantern (12t)",
    jewelCount: 0,
    toothOrLeafCount: "40t hour / 12-leaf cannon (12:1 motion works)",
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "hand_press",
    requiredLubricant: "moebius_hp1300",
    trayCompartment: 2,
    explodeZ: -2.3,
    anchor: [0, 0, -0.8],
    blockedByForRemoval: ["dial_plate"],
    requiresInstalledForMount: ["center_wheel"],
    plainFunction: "Divides center-wheel rotation 12:1 and slips smoothly via friction during hand-setting.",
    inspectionCue: "Keep the curved gold dial washer convex-side up under the dial so the hour wheel never disengages.",
    citation: "ETA 6497-1 Technical Sheet — Motion Works & Cannon Pinion Slip Torque",
  },
  {
    id: "balance_assembly",
    etaNumber: "ETA 105 / 721",
    name: "Balance Cock, Glucydur Wheel & Nivarox Hairspring",
    frenchTerm: "Coq de balancier complet (18 000 A/h)",
    subsystem: "escapement",
    side: "movement",
    material: "Rhodium Brass Cock, Glucydur Rim, Nivarox 1 Spiral, 5 Rubies",
    finish: "Côtes de Genève cock, diamond-cut bevels, Incabloc lyre spring",
    jewelCount: 5,
    toothOrLeafCount: "2.5 Hz (18,000 vph), 14-coil flat spiral, 44° lift",
    screwCount: 1,
    screwBladeMm: 1.2,
    removalTool: "screwdriver_120",
    installTool: "tweezers",
    requiredLubricant: "moebius_9010",
    trayCompartment: 3,
    explodeZ: 4.1,
    anchor: [5.4, -4.6, 1.4],
    blockedByForRemoval: ["case_back"],
    requiresInstalledForMount: ["mainplate", "pallet_cock_fork"],
    plainFunction:
      "The watch's harmonic timebase. Oscillates 5 times per second while Incabloc shock springs protect the 0.08 mm pivots.",
    inspectionCue:
      "Rest the removed balance upside-down on its cock in Compartment 3 so the hairspring hangs free and flat.",
    citation: "Daniels, Watchmaking, Ch. 9; ETA 6497-1 Lubrication — Incabloc 9010",
  },
  {
    id: "pallet_cock_fork",
    etaNumber: "ETA 125 / 710",
    name: "Pallet Cock & Swiss Lever Pallet Fork",
    frenchTerm: "Pont d'ancre et ancre empierrée",
    subsystem: "escapement",
    side: "movement",
    material: "Rhodium Brass Cock, Steel Fork, 2 Synthetic Ruby Stones + 2 Pivot Rubies",
    finish: "Perlage recess, mirror-polished entry/exit ruby impulse planes",
    jewelCount: 4,
    toothOrLeafCount: "Entry & exit stones spanning 2.5 escape teeth, 12° draw",
    screwCount: 2,
    screwBladeMm: 1.0,
    removalTool: "screwdriver_100",
    installTool: "tweezers",
    requiredLubricant: "moebius_9415",
    mustStayDryWarning:
      "Pallet staff pivots in their ruby holes MUST remain completely dry — oil viscosity stalls low-energy unlocking.",
    trayCompartment: 3,
    explodeZ: 3.3,
    anchor: [2.8, -1.8, 0.9],
    blockedByForRemoval: ["balance_assembly"],
    requiresInstalledForMount: ["mainplate", "escape_wheel"],
    requiresMainspringLetDown: true,
    plainFunction:
      "Locks the gear train 95% of each beat and delivers a sharp impulse across the 44° lift arc.",
    inspectionCue:
      "Apply Moebius 9415 only to the pallet stone impulse faces (never the pallet pivots!).",
    citation: "ETA 6497-1 Lubrication Chart — Pallet Stones (9415), Pallet Pivots (DRY)",
  },
  {
    id: "train_bridge",
    etaNumber: "ETA 110",
    name: "Going-Train Bridge",
    frenchTerm: "Pont de rouage",
    subsystem: "going_train",
    side: "movement",
    material: "Rhodium-Plated Brass & 3 Upper Synthetic Rubies",
    finish: "7-stripe Côtes de Genève, anglage bevels, specular ruby sinks",
    jewelCount: 3,
    screwCount: 2,
    screwBladeMm: 1.2,
    removalTool: "screwdriver_120",
    installTool: "tweezers",
    requiredLubricant: "moebius_9010",
    trayCompartment: 4,
    explodeZ: 2.9,
    anchor: [-1.4, -3.6, 1.1],
    blockedByForRemoval: ["case_back"],
    requiresInstalledForMount: ["third_wheel", "fourth_wheel", "escape_wheel"],
    requiresMainspringLetDown: true,
    plainFunction: "Holds upper ruby bearings for the third, fourth, and escape wheels in alignment.",
    inspectionCue:
      "Never tighten a bridge screw until all three pivots sit inside their jewel holes and spin freely to a gentle touch.",
    citation: "De Carle, Practical Watch Repairing, Ch. 6 — Seating Train Pivots",
  },
  {
    id: "escape_wheel",
    etaNumber: "ETA 705",
    name: "Club-Tooth Escape Wheel",
    frenchTerm: "Roue d'échappement (15 dents)",
    subsystem: "going_train",
    side: "movement",
    material: "Hardened Polished Steel (Lower Ruby in Mainplate)",
    finish: "Chamfered club teeth, mirror-burnished 0.07 mm pivots",
    jewelCount: 1,
    toothOrLeafCount: "15 club teeth / 8-leaf pinion (10 rpm = 18,000 vph)",
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "tweezers",
    requiredLubricant: "moebius_9010",
    mustStayDryWarning:
      "Escape wheel pivots take Moebius 9010 in their jewels after bridge assembly; the 15 club teeth stay dry until grazed by 9415 from the pallet stones.",
    trayCompartment: 4,
    explodeZ: 2.2,
    anchor: [1.5, -3.8, 0.5],
    blockedByForRemoval: ["train_bridge", "pallet_cock_fork"],
    requiresInstalledForMount: ["mainplate", "fourth_wheel"],
    plainFunction: "Converts rotary gear-train torque into discrete impulse kicks across the ruby pallet stones.",
    inspectionCue: "Grip only by the wheel crossing arm — never pinch the delicate club teeth with steel tweezers.",
    citation: "ETA 6497-1 Technical Sheet — Escape Wheel 705",
  },
  {
    id: "fourth_wheel",
    etaNumber: "ETA 227",
    name: "Fourth Wheel (Small-Seconds Arbor)",
    frenchTerm: "Roue de seconde (80 dents)",
    subsystem: "going_train",
    side: "movement",
    material: "Gilded High-Leaded Watch Brass & Steel Pinion (Lower Ruby in Mainplate)",
    finish: "Circular satin spokes, extended dial-side seconds pivot",
    jewelCount: 1,
    toothOrLeafCount: "80 teeth / 10-leaf pinion (1 rev / 60 s at 9 o'clock)",
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "tweezers",
    requiredLubricant: "moebius_9010",
    trayCompartment: 4,
    explodeZ: 1.9,
    anchor: [-3.9, 0.0, 0.5],
    blockedByForRemoval: ["train_bridge", "hands_set"],
    requiresInstalledForMount: ["mainplate", "third_wheel"],
    plainFunction: "Rotates once per minute at 9 o'clock to carry the small-seconds hand and drive the escape pinion 10:1.",
    inspectionCue: "Mind the long dial-side seconds pivot when lifting — lift straight up along the movement axis.",
    citation: "ETA 6497-1 Technical Sheet — Fourth Wheel 227",
  },
  {
    id: "third_wheel",
    etaNumber: "ETA 210",
    name: "Third Wheel",
    frenchTerm: "Roue moyenne (75 dents)",
    subsystem: "going_train",
    side: "movement",
    material: "Gilded Watch Brass & Hardened Steel Pinion (Lower Ruby in Mainplate)",
    finish: "Circular grained rim, polished leaves",
    jewelCount: 1,
    toothOrLeafCount: "75 teeth / 10-leaf pinion (7.5:1 to fourth wheel)",
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "tweezers",
    requiredLubricant: "moebius_9010",
    trayCompartment: 4,
    explodeZ: 1.6,
    anchor: [-2.2, -3.5, 0.5],
    blockedByForRemoval: ["train_bridge"],
    requiresInstalledForMount: ["mainplate", "center_wheel"],
    plainFunction: "Bridges the center wheel (8:1) and fourth wheel (7.5:1) to yield the exact 60:1 minute-to-second ratio.",
    inspectionCue: "Verify teeth are free of dried green verdigris or brass burrs under 10x loupe.",
    citation: "ETA 6497-1 Technical Sheet — Gear Train Ratios (80/10 x 75/10 = 60)",
  },
  {
    id: "barrel_bridge",
    etaNumber: "ETA 112 / 415 / 420",
    name: "Barrel Bridge, Ratchet & Left-Hand Crown Wheel",
    frenchTerm: "Pont de barillet, rochet et roue de couronne",
    subsystem: "power_barrel",
    side: "movement",
    material: "Rhodium Brass Bridge, Sunburst Steel Wheels & 1 Upper Center Ruby",
    finish: "Broad Côtes de Genève, snail-brushed steel ratchet & 3-slot crown screw",
    jewelCount: 1,
    screwCount: 3,
    screwBladeMm: 1.4,
    leftHandThreadNote:
      "AUTHENTIC 6497-1 TRAP: The multi-slot crown wheel screw (5420) has a LEFT-HAND THREAD — turn clockwise to loosen!",
    removalTool: "screwdriver_140",
    installTool: "screwdriver_140",
    requiredLubricant: "moebius_hp1300",
    trayCompartment: 5,
    explodeZ: 2.6,
    anchor: [-3.2, 4.2, 1.1],
    blockedByForRemoval: ["mainspring_power"],
    requiresInstalledForMount: ["mainspring_barrel", "center_wheel"],
    requiresMainspringLetDown: true,
    plainFunction: "Supports the mainspring barrel arbor, crown/ratchet winding transmission, and upper center-wheel jewel.",
    inspectionCue:
      "Notice the triple-slotted screw head on the crown wheel: Swiss watchmaking shorthand for a reverse (left-hand) thread.",
    citation: "ETA 6497-1 Technical Sheet — Left-Hand Crown Wheel Screw 5420",
  },
  {
    id: "mainspring_barrel",
    etaNumber: "ETA 180 / 195 / 770",
    name: "Complete Mainspring Barrel (84t)",
    frenchTerm: "Barillet complet et ressort Nivaflex",
    subsystem: "power_barrel",
    side: "movement",
    material: "Gilded Brass Drum, Steel Arbor, Nivaflex Alloy Mainspring",
    finish: "Snapped cover, radial brushed drum, 84 involute/epicycloidal teeth",
    jewelCount: 0,
    toothOrLeafCount: "84 teeth (~6.5 active turns, 46-hour power reserve)",
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "tweezers",
    requiredLubricant: "moebius_8200",
    trayCompartment: 5,
    explodeZ: 1.5,
    anchor: [-4.2, 4.4, 0.4],
    blockedByForRemoval: ["barrel_bridge"],
    requiresInstalledForMount: ["mainplate", "center_wheel"],
    plainFunction: "Stores manual winding work in an unbreakable Nivaflex alloy ribbon and drives the center pinion 7:1.",
    inspectionCue: "Lubricate mainspring wall/coils lightly with Moebius 8200 and barrel arbor shoulders with HP1300.",
    citation: "ETA 6497-1 Lubrication — Barrel Drum (8200) & Arbor (HP1300)",
  },
  {
    id: "center_wheel",
    etaNumber: "ETA 206",
    name: "Center Wheel & Cock",
    frenchTerm: "Roue de centre (80 dents)",
    subsystem: "going_train",
    side: "movement",
    material: "Gilded Watch Brass, Hollow Steel Arbor & 1 Lower Mainplate Ruby",
    finish: "Circular satin spokes, burnished center post",
    jewelCount: 1,
    toothOrLeafCount: "80 teeth / 12-leaf pinion (1.00 rev/hour)",
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "tweezers",
    requiredLubricant: "moebius_hp1300",
    trayCompartment: 5,
    explodeZ: 1.1,
    anchor: [0, 0, 0.3],
    blockedByForRemoval: ["barrel_bridge", "train_bridge", "hour_wheel_cannon"],
    requiresInstalledForMount: ["mainplate"],
    plainFunction: "Turns once every 60 minutes at the center of the watch to carry the cannon pinion and minute hand.",
    inspectionCue: "High torque, slow speed: lubricate pivots with high-pressure Moebius HP1300, never thin 9010.",
    citation: "ETA 6497-1 Lubrication — Center Wheel Pivots (HP1300)",
  },
  {
    id: "keyless_works",
    etaNumber: "ETA 435 / 440 / 443",
    name: "Keyless Works & Yoke Spring",
    frenchTerm: "Minuterie et ressort de bascule",
    subsystem: "keyless_works",
    side: "dial",
    material: "Hardened Tempered Steel",
    finish: "Straight-grained steel yoke (435), U-shaped jumper spring (440)",
    jewelCount: 0,
    screwCount: 2,
    screwBladeMm: 1.0,
    removalTool: "screwdriver_100",
    installTool: "tweezers",
    requiredLubricant: "moebius_9501",
    highLaunchRisk: true,
    trayCompartment: 6,
    explodeZ: -1.6,
    anchor: [8.2, 1.8, -0.5],
    blockedByForRemoval: ["dial_plate", "stem_crown"],
    requiresInstalledForMount: ["mainplate"],
    plainFunction: "Switches stem movement crisply between manual winding and hand-setting positions.",
    inspectionCue:
      "Hold boxwood pegwood firmly over the yoke spring (440) while lifting — unbraced springs launch into orbit.",
    citation: "De Carle, Practical Watch Repairing — Keyless Works & Spring Control",
  },
  {
    id: "mainplate",
    etaNumber: "ETA 100",
    name: "Mainplate (16½ Lignes / 36.60 mm)",
    frenchTerm: "Platine perlée",
    subsystem: "foundation",
    side: "movement",
    material: "Rhodium-Plated Brass & Pressed Synthetic Rubies",
    finish: "Concentric overlapping perlage, milled barrel & train recesses",
    jewelCount: 0,
    screwCount: 0,
    removalTool: "tweezers",
    installTool: "tweezers",
    requiredLubricant: "moebius_9010",
    trayCompartment: 6,
    explodeZ: 0.0,
    anchor: [0, 0, 0],
    blockedByForRemoval: [
      "center_wheel",
      "mainspring_barrel",
      "third_wheel",
      "fourth_wheel",
      "escape_wheel",
      "pallet_cock_fork",
      "balance_assembly",
      "keyless_works",
    ],
    requiresInstalledForMount: [],
    plainFunction:
      "The 36.60 mm structural datum plate carrying all recesses, steady pins, and lower jewel bearings.",
    inspectionCue: "Inspect lower jewel oil sinks after ultrasonic cleaning and pegwood dressing before reassembly.",
    citation: "ETA 6497-1 Technical Sheet — Caliber Dimensions 36.60 x 4.50 mm",
  },
] as const

// Sanity sum check: 5 (balance) + 4 (pallet) + 3 (train bridge) + 1 (escape) + 1 (fourth) + 1 (third) + 1 (barrel bridge) + 1 (center) = 17!
// Wait: mainplate jewelCount above was 1, which would make 18! Let's check:
// 5 (balance) + 4 (pallet) + 3 (train bridge) + 1 (escape lower) + 1 (fourth lower) + 1 (third lower) + 1 (barrel bridge upper center) + 1 (center lower) = 17!
// Let's make mainplate jewelCount 0 because each lower ruby is already counted on its respective wheel/balance/pallet!

export const TOTAL_6497_JEWELS = 17

export const ALL_INSTALLED_PART_IDS: readonly string[] = CALIBER_6497_PARTS.map(
  (p) => p.id
)

export function getPartById(id: string): CaliberPartSpec | undefined {
  return CALIBER_6497_PARTS.find((p) => p.id === id)
}

export function getBlockingPartsForRemoval(
  partId: string,
  installedParts: ReadonlySet<string>,
  mainspringLetDown: boolean
): { blocked: boolean; blockers: CaliberPartSpec[]; needsLetDown: boolean } {
  const spec = getPartById(partId)
  if (!spec) {
    return { blocked: true, blockers: [], needsLetDown: false }
  }
  const blockers = spec.blockedByForRemoval
    .filter((blockerId) => installedParts.has(blockerId))
    .map((id) => getPartById(id))
    .filter((x): x is CaliberPartSpec => Boolean(x))

  const needsLetDown = Boolean(spec.requiresMainspringLetDown && !mainspringLetDown)
  return {
    blocked: blockers.length > 0 || needsLetDown,
    blockers,
    needsLetDown,
  }
}

export function getMissingPartsForInstall(
  partId: string,
  installedParts: ReadonlySet<string>
): { canMount: boolean; missing: CaliberPartSpec[] } {
  const spec = getPartById(partId)
  if (!spec) return { canMount: false, missing: [] }
  const missing = spec.requiresInstalledForMount
    .filter((reqId) => !installedParts.has(reqId))
    .map((id) => getPartById(id))
    .filter((x): x is CaliberPartSpec => Boolean(x))
  return {
    canMount: missing.length === 0,
    missing,
  }
}
