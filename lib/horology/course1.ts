// Structured Horological Curriculum: Course 1 (Unitas / ETA 6497-1, 11 Lessons),
// Phases 2-5 + Atelier I-III Syllabus Roadmap, 20-Question Pre/Post Assessment,
// and Cited "Ask Henri" Reference Cards.
// Every procedural rule carries a real horological source citation and advisor sign-off slot.

import type { BenchToolId, LubricantId, MovementSide } from "./caliber6497"
import type { ServiceConditionState } from "./physics"
import { ARRIVAL_GUMMED_CONDITIONS, CLEAN_SERVICE_CONDITIONS } from "./physics"

export type LessonPhaseMode = "show" | "guide" | "solo" | "debrief"

export type StepActionKind =
  | "inspect_part"
  | "open_timegrapher"
  | "remove_part"
  | "let_down_mainspring"
  | "ultrasonic_clean"
  | "install_part"
  | "oil_part"
  | "wind_crown"
  | "regulate_watch"
  | "demagnetize"

export interface LessonStepSpec {
  id: string
  title: string
  action: StepActionKind
  targetPartId?: string
  requiredTool?: BenchToolId
  requiredBladeMm?: number
  requiredLubricant?: LubricantId
  /** True when turning a left-hand screw clockwise to loosen */
  leftHandThread?: boolean
  /** Required protective modifier (e.g. dial protector sheet or pegwood brace) */
  requiresBraceOrGuard?: boolean
  masterShow: string
  masterGuide: string
  consequenceOnError: string
  citation: string
}

export interface LessonSpec {
  id: string
  number: number
  slug: string
  title: string
  subtitle: string
  durationMinutes: number
  defaultSide: MovementSide
  startingInstalledParts: string[]
  startingMainspringLetDown: boolean
  startingWindFraction: number
  startingConditions: ServiceConditionState
  startingRegulatorMicrons?: number
  startingColletOffsetDeg?: number
  henriIntro: string
  henriDebriefPass: string
  henriBenchNote: string
  advisorSignoffId: string
  steps: LessonStepSpec[]
}

const ALL_CASED_PARTS = [
  "mainplate",
  "keyless_works",
  "center_wheel",
  "mainspring_barrel",
  "barrel_bridge",
  "third_wheel",
  "fourth_wheel",
  "escape_wheel",
  "train_bridge",
  "pallet_cock_fork",
  "balance_assembly",
  "hour_wheel_cannon",
  "dial_plate",
  "hands_set",
  "stem_crown",
  "mainspring_power",
  "case_back",
]

const UNCASED_MOVEMENT_PARTS = [
  "mainplate",
  "keyless_works",
  "center_wheel",
  "mainspring_barrel",
  "barrel_bridge",
  "third_wheel",
  "fourth_wheel",
  "escape_wheel",
  "train_bridge",
  "pallet_cock_fork",
  "balance_assembly",
  "mainspring_power",
]

export const COURSE_1_LESSONS: readonly LessonSpec[] = [
  {
    id: "c1-l01",
    number: 1,
    slug: "orientation",
    title: "Orientation & Baseline Listening",
    subtitle: "Inspect the 16½-ligne Unitas 6497-1 under the loupe and clock its tired arrival trace.",
    durationMinutes: 6,
    defaultSide: "movement",
    startingInstalledParts: ALL_CASED_PARTS,
    startingMainspringLetDown: false,
    startingWindFraction: 0.78,
    startingConditions: ARRIVAL_GUMMED_CONDITIONS,
    startingRegulatorMicrons: -55,
    startingColletOffsetDeg: 1.4,
    henriIntro:
      "Sit down, pull the lamp low, and rest your forearms on the green Bergeon mat. Before a watchmaker touches a screwdriver, we look and we listen. This pocket watch carries an ETA 6497-1: large parts, honest bridges, and dried nine-year-old oil.",
    henriDebriefPass:
      "Good eyes. Notice that 218° Dial-Up amplitude and 0.6 ms beat error on the tape? Dried oil in the going train is starving the balance. Keep that arrival reading in mind; by Lesson 10 you will bring it past 290°.",
    henriBenchNote: "Listen to the 2.5 Hz beat and log the tired 218° arrival trace before touching a screw.",
    advisorSignoffId: "WOSTEP-6497-01",
    steps: [
      {
        id: "l01-s1",
        title: "Inspect the Balance & Hairspring under 4× Loupe",
        action: "inspect_part",
        targetPartId: "balance_assembly",
        masterShow:
          "Watch the Glucydur rim swing under the balance cock. Five beats a second, 18,000 vibrations per hour, with the Nivarox spiral breathing concentrically.",
        masterGuide:
          "Select or click the Balance Cock & Wheel assembly to inspect its 5 synthetic rubies and Incabloc lyre spring.",
        consequenceOnError: "Inspecting never harms a part. Take your time reading the bridges.",
        citation: "ETA 6497-1 Technical Communication, p. 1, Caliber Architecture",
      },
      {
        id: "l01-s2",
        title: "Inspect the Going-Train Bridge",
        action: "inspect_part",
        targetPartId: "train_bridge",
        masterShow:
          "Follow power from the barrel through center, third, fourth, and the 15-tooth club escape wheel beneath this Côtes de Genève bridge.",
        masterGuide: "Click the Going-Train Bridge (ETA 110) to read its three upper ruby bearings.",
        consequenceOnError: "Observation step only.",
        citation: "Daniels, Watchmaking, Ch. 5, Wheel Train Ratios",
      },
      {
        id: "l01-s3",
        title: "Pull Up the Acoustic Timegrapher",
        action: "open_timegrapher",
        masterShow:
          "A piezo microphone hears three tiny impacts every 200 milliseconds: unlock, impulse, and drop. Their spacing reveals rate, amplitude, and beat error.",
        masterGuide:
          "Open the Timegrapher strip (`T`) to log the watch's gummed arrival baseline.",
        consequenceOnError: "Always record an arrival reading before disassembly so nothing surprises you at casing.",
        citation: "Witschi Chronoscope Operating Manual, 44° Lift Angle Calibration",
      },
    ],
  },
  {
    id: "c1-l02",
    number: 2,
    slug: "uncasing-hands-dial",
    title: "Uncasing, Hands & Enamel Dial",
    subtitle: "Pop the exhibition back, pull the stem safely, guard the enamel dial, and lift the blued hands.",
    durationMinutes: 10,
    defaultSide: "movement",
    startingInstalledParts: ALL_CASED_PARTS,
    startingMainspringLetDown: false,
    startingWindFraction: 0.75,
    startingConditions: ARRIVAL_GUMMED_CONDITIONS,
    henriIntro:
      "More watches are scarred in the first three minutes than in the whole strip-down. Slip a case knife without bracing and you gouge steel; pry hands without a dial sheet and you crack white enamel.",
    henriDebriefPass:
      "Clean uncasing: zero scratches on the enamel chapter ring, setting lever still engaged on the dial side because you stopped at 1.5 turns.",
    henriBenchNote: "Stop the 1.20 mm setting lever screw at 1.5 turns and always lay a dial sheet under hand levers.",
    advisorSignoffId: "WOSTEP-6497-02",
    steps: [
      {
        id: "l02-s1",
        title: "Pop the Exhibition Caseback at the 9H Notch",
        action: "remove_part",
        targetPartId: "case_back",
        requiredTool: "case_knife",
        masterShow:
          "Seat the case knife firmly into the machined 9 o'clock lip and twist the wrist slightly rather than shoving forward.",
        masterGuide: "Equip the Case Knife (`C`) and remove the Exhibition Caseback into Tray Compartment 1.",
        consequenceOnError: "Using tweezers or a screwdriver blade on a case lip snaps the tip and mars the bezel.",
        citation: "De Carle, Practical Watch Repairing, Opening Snap Cases",
      },
      {
        id: "l02-s2",
        title: "Release Winding Stem (1.20 mm Red Screwdriver, 1.5 Turns Max)",
        action: "remove_part",
        targetPartId: "stem_crown",
        requiredTool: "screwdriver_120",
        requiredBladeMm: 1.2,
        masterShow:
          "Turn the setting lever screw one and a half turns with the 1.20 mm red screwdriver while gently drawing the stem out.",
        masterGuide:
          "Select the 1.20 mm Screwdriver (`4`) and extract the Winding Stem & Crown.",
        consequenceOnError:
          "Backing the setting lever screw all the way out drops the setting lever loose under the dial.",
        citation: "ETA 6497-1 Technical Sheet, Setting Lever Screw 5443",
      },
      {
        id: "l02-s3",
        title: "Lift Blued Hands Over Protective Dial Sheet",
        action: "remove_part",
        targetPartId: "hands_set",
        requiredTool: "hand_levers",
        requiresBraceOrGuard: true,
        masterShow:
          "Flip to the dial side, slide the poly dial protector under the bosses, and rock both polished hand levers evenly so the cannon post stays dead straight.",
        masterGuide:
          "Equip Hand Levers + Dial Sheet (`9`), engage Brace / Protector (`Shift`), and lift the Blued Hands.",
        consequenceOnError: "Prying hands without the protector sheet bruises or hairline-cracks vitreous enamel.",
        citation: "Fried, The Watch Repairer's Manual, Hand Removal",
      },
      {
        id: "l02-s4",
        title: "Unlock 0.80 mm Dial-Foot Screws & Lift Dial",
        action: "remove_part",
        targetPartId: "dial_plate",
        requiredTool: "screwdriver_080",
        requiredBladeMm: 0.8,
        masterShow:
          "Half a turn on both 0.80 mm flank screws frees the copper dial feet so the enamel disk lifts straight off.",
        masterGuide:
          "Equip the 0.80 mm Orange Screwdriver (`2`) and lift the Enamel Dial into Tray Compartment 2.",
        consequenceOnError: "Lifting a dial with one foot still clamped bends the soldered copper foot.",
        citation: "ETA 6497-1 Technical Sheet, Dial Feet Fastening",
      },
    ],
  },
  {
    id: "c1-l03",
    number: 3,
    slug: "letting-down-mainspring",
    title: "Letting Down the Mainspring",
    subtitle: "The essential safety habit: bleed 46 hours of barrel torque before touching any bridge screw.",
    durationMinutes: 5,
    defaultSide: "movement",
    startingInstalledParts: UNCASED_MOVEMENT_PARTS,
    startingMainspringLetDown: false,
    startingWindFraction: 0.85,
    startingConditions: ARRIVAL_GUMMED_CONDITIONS,
    henriIntro:
      "Stop right here. Inside that brass barrel sits a coiled Nivaflex ribbon pulling on every tooth in the train. Lift the pallet cock while it is wound and the escape wheel will spin at 6,000 rpm and snap a 0.07 mm pivot.",
    henriDebriefPass:
      "You felt the crown push back against your thumb and eased it down turn by turn. No watch on your bench will ever suffer runaway recoil if that stays muscle memory.",
    henriBenchNote: "Hold the crown between thumb and forefinger while pegwood eases Click 425 clear.",
    advisorSignoffId: "WOSTEP-6497-03",
    steps: [
      {
        id: "l03-s1",
        title: "Control Crown & Disengage Click 425 with Pegwood",
        action: "let_down_mainspring",
        targetPartId: "mainspring_power",
        requiredTool: "pegwood",
        requiresBraceOrGuard: true,
        masterShow:
          "Hold the winding stem between thumb and forefinger, ease the click away from the ratchet teeth with sharpened boxwood pegwood, and let the barrel walk down smoothly.",
        masterGuide:
          "Select Boxwood Pegwood (`6`), engage Thumb Brace (`Shift`), and click the Click & Ratchet (`mainspring_power`) to let down all stored power.",
        consequenceOnError:
          "Releasing the click without thumb control snaps the ratchet backward and strips click teeth.",
        citation: "ETA 6497-1 Service Manual §2.1, Discharging the Mainspring",
      },
    ],
  },
  {
    id: "c1-l04",
    number: 4,
    slug: "balance-and-pallet-removal",
    title: "Protecting the Balance & Pallet Fork",
    subtitle: "Extract the watch's two most delicate organs first so nothing can slip into the hairspring.",
    durationMinutes: 8,
    defaultSide: "movement",
    startingInstalledParts: UNCASED_MOVEMENT_PARTS.filter((p) => p !== "mainspring_power"),
    startingMainspringLetDown: true,
    startingWindFraction: 0.0,
    startingConditions: ARRIVAL_GUMMED_CONDITIONS,
    henriIntro:
      "With the barrel dead, we clear the balance assembly first. A single slip near a Nivarox spiral costs an afternoon of hairspring truing.",
    henriDebriefPass:
      "Balance resting inverted on its cock in Compartment 3, pallet fork tucked safely beside it. Not a single kinked coil.",
    henriBenchNote: "Clear the balance first and lay its cock inverted in Compartment 3 so the spiral hangs free.",
    advisorSignoffId: "WOSTEP-6497-04",
    steps: [
      {
        id: "l04-s1",
        title: "Unscrew & Lift the Balance Assembly into Compartment 3",
        action: "remove_part",
        targetPartId: "balance_assembly",
        requiredTool: "screwdriver_120",
        requiredBladeMm: 1.2,
        masterShow:
          "Back out the 1.20 mm cock screw, lift straight up so the roller clears the fork horns, and lay the cock upside-down in Compartment 3.",
        masterGuide:
          "Use the 1.20 mm Red Screwdriver (`4`) to release and store the Balance Cock & Wheel.",
        consequenceOnError: "Tilting the cock sideways snags the lower balance pivot in the mainplate jewel.",
        citation: "Daniels, Watchmaking, Ch. 9, Handling the Balance & Spring",
      },
      {
        id: "l04-s2",
        title: "Unscrew the Pallet Cock (1.00 mm Black) & Lift Fork",
        action: "remove_part",
        targetPartId: "pallet_cock_fork",
        requiredTool: "screwdriver_100",
        requiredBladeMm: 1.0,
        masterShow:
          "Two smaller 1.00 mm screws hold the pallet cock. Notice there is zero kick when the cock lifts because you discharged the barrel first.",
        masterGuide:
          "Switch to the 1.00 mm Black Screwdriver (`3`) and remove the Pallet Cock & Fork.",
        consequenceOnError:
          "Using the wider 1.20 mm blade on the 1.00 mm pallet screw recess scores the circular perlage.",
        citation: "ETA 6497-1 Technical Sheet, Pallet Cock Screws (1.00 mm)",
      },
    ],
  },
  {
    id: "c1-l05",
    number: 5,
    slug: "stripping-going-train-and-barrel",
    title: "Stripping the Train, Left-Hand Screw & Keyless Works",
    subtitle: "Disassemble the going train, spot ETA's famous reverse-thread crown-wheel screw, and tame the yoke spring.",
    durationMinutes: 12,
    defaultSide: "movement",
    startingInstalledParts: [
      "mainplate",
      "keyless_works",
      "center_wheel",
      "mainspring_barrel",
      "barrel_bridge",
      "third_wheel",
      "fourth_wheel",
      "escape_wheel",
      "train_bridge",
    ],
    startingMainspringLetDown: true,
    startingWindFraction: 0.0,
    startingConditions: ARRIVAL_GUMMED_CONDITIONS,
    henriIntro:
      "Now the architecture opens right up. Watch out for two classic apprentice traps on the 6497: the triple-slotted crown-wheel screw is left-hand threaded, and the dial-side yoke spring wants to jump across the room.",
    henriDebriefPass:
      "Down to the bare perlée mainplate without snapping the left-hand crown screw or losing the yoke spring to the floorboards. Every compartment in your dust-cover tray is organized.",
    henriBenchNote: "Three slots on the crown-wheel screw mean left-hand thread: turn clockwise to loosen.",
    advisorSignoffId: "WOSTEP-6497-05",
    steps: [
      {
        id: "l05-s1",
        title: "Remove the Going-Train Bridge (1.20 mm)",
        action: "remove_part",
        targetPartId: "train_bridge",
        requiredTool: "screwdriver_120",
        requiredBladeMm: 1.2,
        masterShow:
          "Unscrew both 1.20 mm blued screws and lift the bridge vertically off its steady pins so all three upper pivots clear squarely.",
        masterGuide: "Use the 1.20 mm Red Screwdriver (`4`) to lift the Going-Train Bridge.",
        consequenceOnError: "Prying one corner of a bridge bends the 0.07 mm escape wheel upper pivot.",
        citation: "De Carle, Practical Watch Repairing, Ch. 6",
      },
      {
        id: "l05-s2",
        title: "Lift Escape, Fourth, and Third Wheels with Tweezers",
        action: "remove_part",
        targetPartId: "escape_wheel",
        requiredTool: "tweezers",
        masterShow:
          "Grip the escape wheel by its crossing arm, never the club teeth, then lift the fourth and third wheels straight out.",
        masterGuide: "Equip Tweezers (`1`) and lift the Club-Tooth Escape Wheel.",
        consequenceOnError: "Pinching escape teeth leaves microscopic burrs that ruin impulse.",
        citation: "ETA 6497-1 Service Sheet, Wheel Train Disassembly",
      },
      {
        id: "l05-s3",
        title: "Lift the Fourth Wheel (Long Seconds Arbor)",
        action: "remove_part",
        targetPartId: "fourth_wheel",
        requiredTool: "tweezers",
        masterShow: "Draw the fourth wheel straight upward so its extended 9H seconds pivot clears the bushing cleanly.",
        masterGuide: "With Tweezers (`1`), lift the Fourth Wheel into Compartment 4.",
        consequenceOnError: "Angling the fourth wheel bends the long seconds post.",
        citation: "ETA 6497-1 Service Sheet, Fourth Wheel 227",
      },
      {
        id: "l05-s4",
        title: "Lift the Third Wheel",
        action: "remove_part",
        targetPartId: "third_wheel",
        requiredTool: "tweezers",
        masterShow: "Lift the 75-tooth third wheel from its recess.",
        masterGuide: "With Tweezers (`1`), lift the Third Wheel into Compartment 4.",
        consequenceOnError: "Keep brass teeth clear of steel tweezer points.",
        citation: "ETA 6497-1 Service Sheet, Third Wheel 210",
      },
      {
        id: "l05-s5",
        title: "Remove Barrel Bridge & Left-Hand Crown Screw (1.40 mm)",
        action: "remove_part",
        targetPartId: "barrel_bridge",
        requiredTool: "screwdriver_140",
        requiredBladeMm: 1.4,
        leftHandThread: true,
        masterShow:
          "See the three slots cut into the crown-wheel screw head? That tells any Swiss watchmaker it is left-hand threaded. Turn clockwise to loosen, then back out the three 1.40 mm bridge screws.",
        masterGuide:
          "Select the 1.40 mm Grey Screwdriver (`5`), toggle Reverse / Left-Hand Mode (`R`), and remove the Barrel Bridge.",
        consequenceOnError:
          "Turning the left-hand crown-wheel screw counter-clockwise shears the blued head flush in the bridge.",
        citation: "ETA 6497-1 Technical Sheet, Left-Hand Screw 5420 Warning",
      },
      {
        id: "l05-s6",
        title: "Lift Mainspring Barrel & Center Wheel",
        action: "remove_part",
        targetPartId: "mainspring_barrel",
        requiredTool: "tweezers",
        masterShow: "Lift out the 84-tooth barrel drum, leaving the center wheel exposed.",
        masterGuide: "Equip Tweezers (`1`) and lift the Complete Mainspring Barrel into Compartment 5.",
        consequenceOnError: "Lift level out of the mainplate recess.",
        citation: "ETA 6497-1 Service Sheet, Barrel 180",
      },
      {
        id: "l05-s7",
        title: "Lift Center Wheel & Braced Keyless Works",
        action: "remove_part",
        targetPartId: "center_wheel",
        requiredTool: "tweezers",
        masterShow: "Lift the 80-tooth center wheel from the center ruby.",
        masterGuide: "With Tweezers (`1`), lift the Center Wheel into Compartment 5.",
        consequenceOnError: "Avoid scraping the center post.",
        citation: "ETA 6497-1 Service Sheet, Center Wheel 206",
      },
      {
        id: "l05-s8",
        title: "Brace & Lift the Keyless Yoke Spring",
        action: "remove_part",
        targetPartId: "keyless_works",
        requiredTool: "screwdriver_100",
        requiredBladeMm: 1.0,
        requiresBraceOrGuard: true,
        masterShow:
          "Hold pegwood down on the U-shaped yoke spring before unhooking its nose, or you will spend twenty minutes on hands and knees with a magnet.",
        masterGuide:
          "Equip the 1.00 mm Screwdriver (`3`), engage Pegwood Brace (`Shift`), and remove the Keyless Works.",
        consequenceOnError: "Unbraced yoke spring 440 launches off the mainplate.",
        citation: "De Carle, Practical Watch Repairing, Keyless Spring Caution",
      },
    ],
  },
  {
    id: "c1-l06",
    number: 6,
    slug: "cleaning-and-inspection",
    title: "Pegging Jewels & Ultrasonic Cleaning",
    subtitle: "Dress dried oil out of every ruby hole with boxwood pegwood before running the three-bath wash.",
    durationMinutes: 6,
    defaultSide: "movement",
    startingInstalledParts: ["mainplate"],
    startingMainspringLetDown: true,
    startingWindFraction: 0.0,
    startingConditions: ARRIVAL_GUMMED_CONDITIONS,
    henriIntro:
      "A cleaning machine is not magic. Hardened nine-year-old oil baked inside a jewel sink needs sharpened boxwood pegwood first, then wash, double hydrocarbon rinse, and warm air.",
    henriDebriefPass:
      "Every synthetic ruby gleams crimson under the loupe with crisp dry epilame walls. Now we build upward.",
    henriBenchNote: "Dress baked varnish out of every ruby hole with sharpened boxwood before ultrasonic washing.",
    advisorSignoffId: "WOSTEP-6497-06",
    steps: [
      {
        id: "l06-s1",
        title: "Peg Mainplate Jewel Sinks with Sharpened Boxwood",
        action: "inspect_part",
        targetPartId: "mainplate",
        requiredTool: "pegwood",
        masterShow:
          "Twirl freshly whittled pegwood gently in each ruby hole to lift oxidized oil rings without scratching the corundum.",
        masterGuide: "Select Boxwood Pegwood (`6`) and click the Mainplate to dress the jewel sinks.",
        consequenceOnError: "Skipping pegwood leaves glazed varnish rings that spoil fresh Moebius 9010.",
        citation: "WOSTEP Bench Manual, Manual Pre-Cleaning of Jewels",
      },
      {
        id: "l06-s2",
        title: "Run 3-Bath Ultrasonic Wash, Rinse & Warm Dry",
        action: "ultrasonic_clean",
        masterShow:
          "Basket compartments keep pivots separated through ammoniated wash, two clean hydrocarbon rinses, and heated drying.",
        masterGuide: "Open the Parts Tray (`P`) and run the Ultrasonic Cleaning Cycle to restore clean surfaces.",
        consequenceOnError: "Never oil over old residue; fresh synthetic oil mixes with oxidized gum and creeps.",
        citation: "ETA 6497-1 Service Sheet, Cleaning & Epilame Notes",
      },
    ],
  },
  {
    id: "c1-l07",
    number: 7,
    slug: "barrel-and-keyless-reassembly",
    title: "Barrel, Center Wheel & High-Pressure Oil",
    subtitle: "Lubricate high-load steel and slow brass pivots with Moebius 8200 and HP1300.",
    durationMinutes: 9,
    defaultSide: "movement",
    startingInstalledParts: ["mainplate", "keyless_works"],
    startingMainspringLetDown: true,
    startingWindFraction: 0.0,
    startingConditions: {
      ...CLEAN_SERVICE_CONDITIONS,
      trainOilQuality: 0.55,
      palletOilQuality: 0.55,
      balanceOilQuality: 0.55,
    },
    henriIntro:
      "Rule one of watch lubrication: slow, heavy torque demands viscous high-pressure oil (Moebius HP1300); fast, feather-light pivots demand thin oil (9010). Swap them and amplitude dies.",
    henriDebriefPass:
      "Barrel turning silk-smooth under the bridge, crown wheel locked counter-clockwise on its left-hand thread, center pivots carrying clean HP1300.",
    henriBenchNote: "Slow high-torque center wheel and barrel arbor pivots take Moebius HP1300, never thin 9010.",
    advisorSignoffId: "WOSTEP-6497-07",
    steps: [
      {
        id: "l07-s1",
        title: "Mount Center Wheel into Mainplate Ruby",
        action: "install_part",
        targetPartId: "center_wheel",
        requiredTool: "tweezers",
        masterShow: "Seat the 80-tooth center wheel squarely into the center ruby before the barrel covers it.",
        masterGuide: "With Tweezers (`1`), install the Center Wheel from Compartment 5.",
        consequenceOnError: "Center wheel must go in before the barrel bridge covers it.",
        citation: "ETA 6497-1 Assembly Sequence §4.1",
      },
      {
        id: "l07-s2",
        title: "Seat Complete Mainspring Barrel",
        action: "install_part",
        targetPartId: "mainspring_barrel",
        requiredTool: "tweezers",
        masterShow: "Lower the barrel drum so its 84 teeth mesh cleanly with the 12-leaf center pinion.",
        masterGuide: "With Tweezers (`1`), install the Complete Mainspring Barrel from Compartment 5.",
        consequenceOnError: "Check mesh with center pinion before placing the bridge.",
        citation: "ETA 6497-1 Assembly Sequence §4.1",
      },
      {
        id: "l07-s3",
        title: "Dress Mainspring Wall with Moebius 8200",
        action: "oil_part",
        targetPartId: "mainspring_barrel",
        requiredTool: "oiler",
        requiredLubricant: "moebius_8200",
        masterShow:
          "Apply light Moebius 8200 grease to the mainspring coils and drum wall so torque uncoils evenly without stick-slip.",
        masterGuide:
          "Equip Micro-Oiler (`8`), choose Moebius 8200, and lubricate the Mainspring Barrel.",
        consequenceOnError:
          "Thin pivot oil inside a barrel squeezes out under mainspring wall pressure.",
        citation: "ETA 6497-1 Lubrication, Mainspring 8200",
      },
      {
        id: "l07-s4",
        title: "Mount Barrel Bridge (1.40 mm Grey Screwdriver)",
        action: "install_part",
        targetPartId: "barrel_bridge",
        requiredTool: "screwdriver_140",
        requiredBladeMm: 1.4,
        masterShow: "Seat the barrel bridge on its steady pins and drive the three 1.40 mm blued screws snug.",
        masterGuide: "Select the 1.40 mm Grey Screwdriver (`5`) and install the Barrel Bridge.",
        consequenceOnError: "Confirm barrel endshake before snugging screws.",
        citation: "ETA 6497-1 Assembly Sequence §4.2",
      },
      {
        id: "l07-s5",
        title: "Oil Center Wheel Jewel with Moebius HP1300 (60% Meniscus)",
        action: "oil_part",
        targetPartId: "center_wheel",
        requiredTool: "oiler",
        requiredLubricant: "moebius_hp1300",
        masterShow:
          "Touch the fine oiler tip straight to the pivot tip so capillary action draws a clean 60% oil ring into the ruby sink.",
        masterGuide:
          "Equip the Micro-Oiler (`8`), choose Moebius HP1300, set normal dose, and oil the Center Wheel.",
        consequenceOnError:
          "Using thin 9010 on the high-torque center wheel squeezes out of the bearing; flooding creeps onto the plate.",
        citation: "ETA 6497-1 Lubrication Chart, Center Wheel (HP1300)",
      },
    ],
  },
  {
    id: "c1-l08",
    number: 8,
    slug: "rebuilding-going-train",
    title: "Seating the Going Train & 9010 Meniscus",
    subtitle: "Coax three hair-thin pivots into upper ruby holes before tightening a single screw.",
    durationMinutes: 11,
    defaultSide: "movement",
    startingInstalledParts: [
      "mainplate",
      "keyless_works",
      "center_wheel",
      "mainspring_barrel",
      "barrel_bridge",
    ],
    startingMainspringLetDown: true,
    startingWindFraction: 0.0,
    startingConditions: {
      ...CLEAN_SERVICE_CONDITIONS,
      trainOilQuality: 0.65,
      palletOilQuality: 0.6,
      balanceOilQuality: 0.6,
    },
    henriIntro:
      "Here is the test of touch every apprentice remembers: seating the going-train bridge over three wheels at once. Tighten a screw while one 0.07 mm pivot sits on the ruby rim and you hear it shear.",
    henriDebriefPass:
      "One gentle puff of air sent the whole four-wheel train spinning freely with crisp backlash, and every fast jewel carries a textbook 60% Moebius 9010 ring.",
    henriBenchNote: "Coax third, fourth, and escape pivots into their upper rubies before touching a screwdriver.",
    advisorSignoffId: "WOSTEP-6497-08",
    steps: [
      {
        id: "l08-s1",
        title: "Place the Third Wheel (75t)",
        action: "install_part",
        targetPartId: "third_wheel",
        requiredTool: "tweezers",
        masterShow: "Lower the third wheel into its lower mainplate ruby, meshing with the center wheel.",
        masterGuide: "Equip Tweezers (`1`) and install the Third Wheel from Compartment 4.",
        consequenceOnError: "Seat lower pivot cleanly in the mainplate jewel.",
        citation: "ETA 6497-1 Assembly Sequence §4.3",
      },
      {
        id: "l08-s2",
        title: "Place the Fourth Wheel (9H Seconds Post)",
        action: "install_part",
        targetPartId: "fourth_wheel",
        requiredTool: "tweezers",
        masterShow: "Guide the long seconds pivot gently down through the 9H jewel hole.",
        masterGuide: "With Tweezers (`1`), install the Fourth Wheel from Compartment 4.",
        consequenceOnError: "Never force the extended seconds arbor if angled.",
        citation: "ETA 6497-1 Assembly Sequence §4.3",
      },
      {
        id: "l08-s3",
        title: "Place the 15-Tooth Escape Wheel",
        action: "install_part",
        targetPartId: "escape_wheel",
        requiredTool: "tweezers",
        masterShow: "Hold by the crossing arm and seat the lower 0.07 mm pivot into its ruby.",
        masterGuide: "With Tweezers (`1`), install the Escape Wheel from Compartment 4.",
        consequenceOnError: "Keep steel tweezers off the 15 club teeth.",
        citation: "ETA 6497-1 Assembly Sequence §4.3",
      },
      {
        id: "l08-s4",
        title: "Coax Pivots & Mount Going-Train Bridge (Pegwood Braced)",
        action: "install_part",
        targetPartId: "train_bridge",
        requiredTool: "screwdriver_120",
        requiredBladeMm: 1.2,
        requiresBraceOrGuard: true,
        masterShow:
          "Hold light pegwood pressure on the bridge while nudging each wheel into its upper ruby hole. Only drive the 1.20 mm screws once the bridge drops dead flat.",
        masterGuide:
          "Select 1.20 mm Screwdriver (`4`), engage Pegwood Brace (`Shift`), and install the Going-Train Bridge.",
        consequenceOnError:
          "Driving bridge screws without seating pivots first bends a wheel pivot and adds permanent friction.",
        citation: "De Carle, Practical Watch Repairing, Ch. 6, Seating the Train Bridge",
      },
      {
        id: "l08-s5",
        title: "Oil Fast Train Jewels with Moebius 9010",
        action: "oil_part",
        targetPartId: "train_bridge",
        requiredTool: "oiler",
        requiredLubricant: "moebius_9010",
        masterShow:
          "Deposit fine Moebius 9010 drops into the third, fourth, and escape jewel sinks, filling 50 to 70% of the oil cup and never flooding onto the rhodium bridge.",
        masterGuide:
          "Select Micro-Oiler (`8`), choose Moebius 9010, keep meniscus at Standard (60%), and oil the Going-Train Bridge.",
        consequenceOnError:
          "Over-oiling looks fine today, then creeps out of the sink within two weeks and drags amplitude down by 60°.",
        citation: "ETA 6497-1 Lubrication Chart, 3rd, 4th & Escape Jewels (9010)",
      },
    ],
  },
  {
    id: "c1-l09",
    number: 9,
    slug: "escapement-and-balance-drop",
    title: "The Heartbeat: Pallet Stones & Dropping the Balance",
    subtitle: "Treat pallet stones with 9415, leave pallet pivots dry, wind two turns, and watch the watch wake up.",
    durationMinutes: 10,
    defaultSide: "movement",
    startingInstalledParts: [
      "mainplate",
      "keyless_works",
      "center_wheel",
      "mainspring_barrel",
      "barrel_bridge",
      "third_wheel",
      "fourth_wheel",
      "escape_wheel",
      "train_bridge",
      "stem_crown",
    ],
    startingMainspringLetDown: true,
    startingWindFraction: 0.0,
    startingConditions: {
      ...CLEAN_SERVICE_CONDITIONS,
      palletOilQuality: 0.6,
      balanceOilQuality: 0.65,
    },
    henriIntro:
      "Every watchmaker works patiently for the next two minutes. Remember the escapement rule: pallet stone faces take a trace of Moebius 9415, while pallet staff pivots stay dry. Then drop the balance and listen.",
    henriDebriefPass:
      "Hear that crisp 5-beat cadence? The instant the impulse jewel slipped into the fork horns, the escapement unlocked and came alive on its own.",
    henriBenchNote: "Moebius 9415 touches only the ruby impulse plane; pallet staff pivots remain strictly dry.",
    advisorSignoffId: "WOSTEP-6497-09",
    steps: [
      {
        id: "l09-s1",
        title: "Mount Pallet Fork & Cock (1.00 mm Screws)",
        action: "install_part",
        targetPartId: "pallet_cock_fork",
        requiredTool: "screwdriver_100",
        requiredBladeMm: 1.0,
        masterShow:
          "Set the pallet fork between the banking pins, seat the cock gently, and snug both 1.00 mm blued screws.",
        masterGuide: "Select the 1.00 mm Black Screwdriver (`3`) and install the Pallet Cock & Fork.",
        consequenceOnError: "Verify the fork snaps briskly from banking pin to banking pin on minimal wind.",
        citation: "ETA 6497-1 Assembly Sequence §4.5",
      },
      {
        id: "l09-s2",
        title: "Treat Ruby Pallet Impulse Stones with Moebius 9415 (Pivots Dry)",
        action: "oil_part",
        targetPartId: "pallet_cock_fork",
        requiredTool: "oiler",
        requiredLubricant: "moebius_9415",
        masterShow:
          "Touch thixotropic Moebius 9415 only to the exit pallet impulse plane every third tooth. Never oil the pallet staff pivot jewels.",
        masterGuide:
          "Equip Micro-Oiler (`8`), select Moebius 9415, and lubricate the Pallet Stones.",
        consequenceOnError:
          "Oiling pallet pivots or flooding escape teeth causes viscous drag that costs over 40° of amplitude.",
        citation: "ETA 6497-1 Lubrication Chart, Pallet Stones (9415), Pallet Pivots (DRY)",
      },
      {
        id: "l09-s3",
        title: "Give Two Turns of Manual Wind on the Crown",
        action: "wind_crown",
        masterShow:
          "Put two gentle turns into the barrel so the escape tooth locks solidly against the entry ruby stone with draw.",
        masterGuide: "Click Wind Crown (+25% Reserve) in the bench controls to energize the escapement.",
        consequenceOnError: "Without barrel torque, the balance will only coast briefly and stop.",
        citation: "Daniels, Watchmaking, Ch. 7, Testing Escapement Draw & Snap",
      },
      {
        id: "l09-s4",
        title: "Drop the Glucydur Balance & Oil Incabloc Capstones (9010)",
        action: "install_part",
        targetPartId: "balance_assembly",
        requiredTool: "tweezers",
        masterShow:
          "Lower the balance slightly rotated so the impulse jewel slips inside the fork horns, rotate the cock onto its pin, and watch the rim settle into 18,000 vph motion.",
        masterGuide: "Equip Tweezers (`1`) and install the Balance Cock & Wheel from Compartment 3.",
        consequenceOnError: "Never press down on a balance cock if the wheel does not swing freely.",
        citation: "ETA 6497-1 Assembly Sequence §4.6",
      },
      {
        id: "l09-s5",
        title: "Oil Upper & Lower Incabloc Capstones with Moebius 9010",
        action: "oil_part",
        targetPartId: "balance_assembly",
        requiredTool: "oiler",
        requiredLubricant: "moebius_9010",
        masterShow:
          "Unhook the brass lyre spring, center a 60% drop of Moebius 9010 on the ruby capstone, and re-latch both Incabloc springs.",
        masterGuide:
          "Equip Micro-Oiler (`8`), select Moebius 9010, and oil the Balance Incabloc Jewels.",
        consequenceOnError: "Dry shock capstones drop flat amplitude below 240° and score balance pivot ends.",
        citation: "ETA 6497-1 Lubrication Chart, Incabloc Shock Absorbers (9010)",
      },
    ],
  },
  {
    id: "c1-l10",
    number: 10,
    slug: "timegrapher-and-regulation",
    title: "Timegrapher Diagnostics, Demagnetizing & 6-Position Regulation",
    subtitle: "Clear residual magnetism, zero beat error below 0.5 ms, and bring rate within ±5 s/d at 270° to 315°.",
    durationMinutes: 12,
    defaultSide: "movement",
    startingInstalledParts: [
      "mainplate",
      "keyless_works",
      "center_wheel",
      "mainspring_barrel",
      "barrel_bridge",
      "third_wheel",
      "fourth_wheel",
      "escape_wheel",
      "train_bridge",
      "pallet_cock_fork",
      "balance_assembly",
      "stem_crown",
      "mainspring_power",
    ],
    startingMainspringLetDown: false,
    startingWindFraction: 1.0,
    startingConditions: {
      ...CLEAN_SERVICE_CONDITIONS,
      magnetizedFactor: 0.85,
    },
    startingRegulatorMicrons: -68,
    startingColletOffsetDeg: 1.9,
    henriIntro:
      "Read the timegrapher ribbon first: the watch is racing +95 s/d with split double lines. Magnetized steel tweezers touched near the Nivarox spiral, and the stud carrier has not been trued yet. Diagnose first, adjust second.",
    henriDebriefPass:
      "292° Dial-Up amplitude, 0.1 ms beat error, +0.8 s/d flat rate, and steady after the 14-day wear check. That trace belongs in a Geneva observatory notebook.",
    henriBenchNote: "Demagnetize clinging hairspring coils before touching the stud carrier or regulator pins.",
    advisorSignoffId: "WOSTEP-6497-10",
    steps: [
      {
        id: "l10-s1",
        title: "Open the Timegrapher & Diagnose Clinging Magnetized Coils",
        action: "open_timegrapher",
        masterShow:
          "A clean watch suddenly running +90 to +120 seconds/day fast almost always has magnetized hairspring coils clinging together and shortening effective length L.",
        masterGuide: "Open the Timegrapher strip (`T`) to observe the steep upward trace and split beat lines.",
        consequenceOnError: "Never push the regulator index all the way to minus to mask magnetism.",
        citation: "Fried, The Watch Repairer's Manual, Magnetism & Hairspring Behavior",
      },
      {
        id: "l10-s2",
        title: "Demagnetize the Movement in the Tunnel Coil",
        action: "demagnetize",
        requiredTool: "demagnetizer",
        masterShow:
          "Hold the movement in the alternating tunnel field and withdraw slowly to arms' length so hysteresis loops decay cleanly to zero.",
        masterGuide:
          "Equip the Tunnel Demagnetizer (`M`) and trigger Demagnetize Movement.",
        consequenceOnError: "Switching off a demagnetizer abruptly while inside the coil re-magnetizes steel parts.",
        citation: "WOSTEP Bench Manual, Demagnetization Procedure",
      },
      {
        id: "l10-s3",
        title: "Zero Beat Error (< 0.5 ms) & Regulate Rate Within ±5 s/d",
        action: "regulate_watch",
        masterShow:
          "First bring the two parallel trace lines together into a single line with the stud/collet carrier (< 0.5 ms), then nudge the regulator pins until the line lies horizontal (±5 s/d) with 270° to 315° Dial-Up amplitude.",
        masterGuide:
          "In the Timegrapher strip, adjust Beat Collet until Beat Error < 0.5 ms and Regulator Index until Rate sits within ±5.0 s/d at full wind.",
        consequenceOnError:
          "Adjusting rate while beat error exceeds 1.5 ms leaves the watch asymmetrical and slow to self-start.",
        citation: "ETA 6497-1 Technical Sheet, Regulation Specs (270° to 315°, BE < 0.5 ms)",
      },
    ],
  },
  {
    id: "c1-l11",
    number: 11,
    slug: "dial-hands-casing-final",
    title: "Motion Works, Blued Hands & Final Casing",
    subtitle: "Set hand clearances parallel over the enamel dial, close the case, and pass Henri's 6-position sign-off.",
    durationMinutes: 8,
    defaultSide: "dial",
    startingInstalledParts: [
      "mainplate",
      "keyless_works",
      "center_wheel",
      "mainspring_barrel",
      "barrel_bridge",
      "third_wheel",
      "fourth_wheel",
      "escape_wheel",
      "train_bridge",
      "pallet_cock_fork",
      "balance_assembly",
      "stem_crown",
      "mainspring_power",
    ],
    startingMainspringLetDown: false,
    startingWindFraction: 1.0,
    startingConditions: CLEAN_SERVICE_CONDITIONS,
    startingRegulatorMicrons: 4,
    startingColletOffsetDeg: 0.1,
    henriIntro:
      "Final lap of Course 1. Seat the hour wheel and convex gold foil washer, lock the Grand Feu dial without over-tightening, press the three blued steel hands dead parallel, and case your finished Unitas 6497-1.",
    henriDebriefPass:
      "Look at that pocket watch ticking at 292° behind clean sapphire, small-seconds hand sweeping the 9 o'clock subdial without a graze. You stripped, cleaned, oiled, and regulated a 17-jewel mechanical movement by hand.",
    henriBenchNote: "Lay the curved gold dial washer convex-side up and sight the blued hands from the side.",
    advisorSignoffId: "WOSTEP-6497-11",
    steps: [
      {
        id: "l11-s1",
        title: "Mount Cannon Pinion, Hour Wheel & Convex Dial Washer",
        action: "install_part",
        targetPartId: "hour_wheel_cannon",
        requiredTool: "hand_press",
        masterShow:
          "Snap the cannon pinion onto the center post, drop the 40-tooth hour wheel over it, and lay the thin gold foil washer curved-side up.",
        masterGuide:
          "Equip the Hand Press (`0`) and install the Hour Wheel & Cannon Pinion from Compartment 2.",
        consequenceOnError: "Omitting the dial washer lets the hour wheel drift out of mesh with the minute wheel.",
        citation: "ETA 6497-1 Technical Sheet, Motion Works Assembly",
      },
      {
        id: "l11-s2",
        title: "Seat Grand Feu Enamel Dial & Lock 0.80 mm Flank Screws",
        action: "install_part",
        targetPartId: "dial_plate",
        requiredTool: "screwdriver_080",
        requiredBladeMm: 0.8,
        masterShow: "Drop both copper feet into the mainplate holes and snug the two 0.80 mm screws gently.",
        masterGuide: "Use the 0.80 mm Orange Screwdriver (`2`) to install the Enamel Dial.",
        consequenceOnError: "Over-torquing dial-foot screws shears soft copper feet.",
        citation: "ETA 6497-1 Technical Sheet, Dial Fastening",
      },
      {
        id: "l11-s3",
        title: "Press Hour, Minute & 9H Small-Seconds Hands Parallel",
        action: "install_part",
        targetPartId: "hands_set",
        requiredTool: "hand_press",
        masterShow:
          "Align hour and minute at 12:00 with nylon press tips, sight from the side to verify equal horizontal clearance, and seat the 9H seconds hand.",
        masterGuide: "Equip the Nylon Hand Press (`0`) and install the Blued Poire Hands.",
        consequenceOnError: "Nose-down minute hand catches the chapter ring or collides with the hour boss at 3:15.",
        citation: "Fried, The Watch Repairer's Manual, Hand Fitting & Division",
      },
      {
        id: "l11-s4",
        title: "Blow Dust Clear & Snap Exhibition Caseback Shut",
        action: "install_part",
        targetPartId: "case_back",
        requiredTool: "hand_press",
        masterShow:
          "One final dust puff across the bridges, check the case gasket, and press the sapphire exhibition back home.",
        masterGuide: "Use the Hand Press (`0`) to close the Exhibition Caseback and complete Course 1.",
        consequenceOnError: "Inspect from all angles before signing the service card.",
        citation: "WOSTEP Final Quality Control Checklist, Cased Inspection",
      },
    ],
  },
] as const

export interface RoadmapCourseSummary {
  phase: string
  title: string
  caliber: string
  status: "playable_v1" | "curriculum_pack"
  lessonsCount: number
  focus: string
}

export const FULL_CURRICULUM_ROADMAP: readonly RoadmapCourseSummary[] = [
  {
    phase: "Course 1",
    title: "The Pocket Watch Foundation",
    caliber: "Unitas / ETA 6497-1 (16½ lignes, 17J, 18,000 vph)",
    status: "playable_v1",
    lessonsCount: 11,
    focus: "Full strip, ultrasonic clean, Moebius oiling, escapement physics, 6-position regulation.",
  },
  {
    phase: "Course 2",
    title: "Automatic Winding & Quickset Date",
    caliber: "Seiko NH35A (21,600 vph) & ETA 2824-2 (28,800 vph)",
    status: "curriculum_pack",
    lessonsCount: 9,
    focus: "Magic Lever and reversing wheels, slipping bridle mainspring barrel, midnight date jumper.",
  },
  {
    phase: "Course 3",
    title: "Diagnostics & Fault Bench",
    caliber: "Vintage Field & Dress Calibers",
    status: "curriculum_pack",
    lessonsCount: 10,
    focus: "Poise truing, hairspring terminal curves, endshake/sideshake corrections, worn bushings.",
  },
  {
    phase: "Course 4",
    title: "Column-Wheel Chronograph",
    caliber: "Valjoux 7750 & Seagull ST19 / Venus 175",
    status: "curriculum_pack",
    lessonsCount: 12,
    focus: "Horizontal clutch depth, eccentric banking screws, heart-cam zero-reset hammers.",
  },
  {
    phase: "Atelier I–III",
    title: "Watchmaking from Raw Stock",
    caliber: "School Watch & George Daniels Tourbillon Cage",
    status: "curriculum_pack",
    lessonsCount: 15,
    focus: "Heat-bluing screws to 290°C, black specular polishing on zinc lap, turning balance staffs.",
  },
] as const

export interface HorologyQuizQuestion {
  id: string
  question: string
  options: readonly [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
  citation: string
}

export const HOROLOGY_20_QUIZ: readonly HorologyQuizQuestion[] = [
  {
    id: "q01",
    question: "What must you always do BEFORE unscrewing the pallet cock or train bridge on a wound ETA 6497-1?",
    options: [
      "Demagnetize the mainplate",
      "Let down the mainspring safely via the click while controlling the crown",
      "Oil the Incabloc capstones",
      "Move the regulator index all the way to minus",
    ],
    correctIndex: 1,
    explanation:
      "Releasing the pallet fork or bridge while wound dumps 46 hours of torque instantly through the gear train, shearing pivots or stripping teeth.",
    citation: "ETA 6497-1 Service Sheet §2.1",
  },
  {
    id: "q02",
    question: "At 18,000 vibrations per hour (vph), how many acoustic beats occur each second and what is the nominal interval between beats?",
    options: [
      "4 beats/s (250 ms)",
      "5 beats/s (200 ms)",
      "6 beats/s (166.7 ms)",
      "8 beats/s (125 ms)",
    ],
    correctIndex: 1,
    explanation: "18,000 / 3,600 seconds = 5 beats per second (2.5 Hz full oscillation), or 200.0 ms per beat.",
    citation: "ETA 6497-1 Technical Communication",
  },
  {
    id: "q03",
    question: "What does the triple-slotted screw head on the ETA 6497-1 crown wheel signify?",
    options: [
      "It requires Moebius 8200 under the head",
      "It has a left-hand (reverse) thread and loosens clockwise",
      "It adjusts mainspring endshake",
      "It must never be removed during service",
    ],
    correctIndex: 1,
    explanation:
      "Three slots (or twin rings) warn that turning counter-clockwise tightens and snaps the screw; crown rotation would unscrew a normal right-hand thread.",
    citation: "ETA 6497-1 Technical Sheet, Screw 5420",
  },
  {
    id: "q04",
    question: "Which parts of the Swiss lever escapement in an ETA 6497-1 must remain strictly DRY (un-oiled)?",
    options: [
      "Center wheel pivots",
      "Incabloc balance capstones",
      "Pallet staff pivots in their ruby jewel holes",
      "Winding stem square and sliding clutch",
    ],
    correctIndex: 2,
    explanation:
      "Pallet fork pivots move only ~10° from rest at tiny unlocking torque; any oil film thickens and stalls unlocking.",
    citation: "ETA 6497-1 Lubrication Chart",
  },
  {
    id: "q05",
    question: "Why do you use Moebius HP1300 on the center wheel pivots instead of thin Moebius 9010?",
    options: [
      "Center wheel pivots turn slowly under high barrel torque and squeeze out low-viscosity oil",
      "HP1300 evaporates cleanly within 48 hours",
      "9010 corrodes gilded watch brass",
      "Center wheel bearings are unjeweled steel",
    ],
    correctIndex: 0,
    explanation:
      "Slow, high-load bearings cannot maintain hydrodynamic film with thin 9010; high-pressure HP1300 (1260 cSt) resists boundary squeeze-out.",
    citation: "ETA 6497-1 Lubrication Chart",
  },
  {
    id: "q06",
    question: "What happens over two weeks when a jewel oil sink is flooded past its meniscus instead of filled 50 to 70%?",
    options: [
      "Amplitude rises permanently by 25°",
      "Excess oil creeps onto surrounding bridge/wheel surfaces, draining the pivot dry and fouling nearby parts",
      "Beat error automatically drops to 0.0 ms",
      "Lift angle increases from 44° to 52°",
    ],
    correctIndex: 1,
    explanation:
      "Capillary forces only retain oil inside the chamfered sink angle; excess spills across the flat plate, starving the pivot.",
    citation: "Daniels, Watchmaking, Ch. 10, Lubrication",
  },
  {
    id: "q07",
    question: "How many turns maximum should you back out the ETA 6497-1 setting lever screw to pull the winding stem?",
    options: [
      "Remove the screw completely",
      "Approximately 1.5 turns",
      "6 full turns",
      "Quarter turn clockwise",
    ],
    correctIndex: 1,
    explanation:
      "Unscrewing past 1.5 to 2 turns disengages the screw tip from the dial-side setting lever, requiring dial removal to re-thread.",
    citation: "ETA 6497-1 Technical Sheet, Screw 5443",
  },
  {
    id: "q08",
    question: "What lift angle must be entered on a timegrapher to compute accurate amplitude for an ETA 6497-1?",
    options: ["36°", "44°", "52°", "58°"],
    correctIndex: 1,
    explanation:
      "The Unitas / ETA 6497-1 uses a 44° lift angle (whereas newer 28,800 vph calibers like ETA 2824-2 often use 50° to 52°). Entering 52° inflates reported amplitude falsely by about 35°.",
    citation: "ETA 6497-1 Technical Communication; Witschi Lift Angle Table",
  },
  {
    id: "q09",
    question: "What is the healthy Dial-Up full-wind amplitude range for a freshly serviced ETA 6497-1?",
    options: ["160°–195°", "210°–240°", "270°–315°", "340°–370°"],
    correctIndex: 2,
    explanation:
      "Healthy full-wind flat amplitude sits between 270° and 315°; below 250° signals friction or dryness, while above 330° risks knocking against the fork horns.",
    citation: "ETA 6497-1 Technical Sheet, Quality Control",
  },
  {
    id: "q10",
    question: "On a timegrapher trace, two parallel dotted lines separated by a gap indicate:",
    options: [
      "Beat error (asymmetric tick vs. tock interval from collet/stud offset)",
      "A broken mainspring",
      "Wrong lift angle setting",
      "Normal 18,000 vph operation",
    ],
    correctIndex: 0,
    explanation:
      "When hairspring equilibrium does not align with the pallet fork dead-center, alternating swings unlock early and late, splitting the trace into two parallel lines.",
    citation: "Witschi Chronoscope Manual, Interpreting Beat Error",
  },
  {
    id: "q11",
    question: "Moving the regulator index toward `+` (Avance) makes the watch run faster because it:",
    options: [
      "Increases mainspring barrel torque",
      "Shortens effective active hairspring length L, increasing spring stiffness k",
      "Adds mass to the Glucydur balance rim",
      "Reduces pallet stone draw angle",
    ],
    correctIndex: 1,
    explanation:
      "Since k = (E * h * t^3) / (12 * L) and T = 2 * pi * sqrt(I / k), shorter active length L raises k and lowers oscillation period T.",
    citation: "Daniels, Watchmaking, Ch. 9",
  },
  {
    id: "q12",
    question: "Why does amplitude naturally drop ~20°–30° when turning a healthy watch from Dial Up (flat) to Crown Up (vertical)?",
    options: [
      "The mainspring unwinds half its turns when vertical",
      "Balance pivots shift from point contact on flat capstones to radial side contact inside olive-hole jewels",
      "The hairspring stops breathing in vertical positions",
      "Escape wheel teeth disengage from the fourth pinion",
    ],
    correctIndex: 1,
    explanation:
      "In flat positions only the rounded pivot tip touches the capstone; vertically, the cylindrical pivot wall rubs inside the hole jewel over a larger contact radius.",
    citation: "De Carle, Practical Watch Repairing — Positional Friction",
  },
  {
    id: "q13",
    question: "A serviced watch suddenly gains +110 seconds/day with erratic amplitude. What should you test FIRST before touching the regulator?",
    options: [
      "Replace the mainspring barrel",
      "Check for and clear hairspring magnetization with a demagnetizer",
      "Add more Moebius 9010 to the escape wheel",
      "Tighten the balance cock screw harder",
    ],
    correctIndex: 1,
    explanation:
      "Magnetized coils cling together mid-swing, drastically shortening active hairspring length and causing large sudden rate gains.",
    citation: "Fried, The Watch Repairer's Manual — Magnetism",
  },
  {
    id: "q14",
    question: "What causes 'knocking' (rebanking) on a mechanical watch?",
    options: [
      "Amplitude exceeding ~328° so the impulse jewel strikes the outside of the pallet fork horns on the return swing",
      "Zero mainspring wind",
      "Missing dial washer",
      "Loose exhibition caseback",
    ],
    correctIndex: 0,
    explanation:
      "Excessive amplitude carries the balance nearly a full turn from dead-center until the roller jewel slams against the back of the fork horn, sending rate sky-high.",
    citation: "Daniels, Watchmaking, Ch. 7",
  },
  {
    id: "q15",
    question: "Why does the ETA 6497-1 fourth wheel sit at 9 o'clock and rotate exactly once per minute?",
    options: [
      "Center (80t) / Third pinion (10) = 8:1, and Third (75t) / Fourth pinion (10) = 7.5:1; 8 x 7.5 = 60 revolutions per hour",
      "It is driven directly off the mainspring barrel",
      "The escape wheel has 60 teeth",
      "It slips via a friction clutch",
    ],
    correctIndex: 0,
    explanation:
      "8 x 7.5 = 60:1 step-up from the 1-rev/hour center wheel, giving 1 rev/min directly on the extended 9H small-seconds post.",
    citation: "ETA 6497-1 Technical Sheet — Gear Train",
  },
  {
    id: "q16",
    question: "What is the purpose of 'draw' (~12° pallet locking angle) in a Swiss lever escapement?",
    options: [
      "To pull the pallet fork securely against its banking pin under escape tooth pressure so shakes cannot accidentally unlock the train",
      "To lubricate the escape teeth",
      "To wind the mainspring in both directions",
      "To hold the cannon pinion tight",
    ],
    correctIndex: 0,
    explanation:
      "Draw angles the locking face so escape-wheel force draws the lever toward the banking pin until the balance roller deliberately unlocks it.",
    citation: "Daniels, Watchmaking, Ch. 7 — The Lever Escapement",
  },
  {
    id: "q17",
    question: "When refitting the going-train bridge over the 3rd, 4th, and escape wheels, when is it safe to tighten the two bridge screws?",
    options: [
      "Immediately after setting the bridge down, to press pivots into place",
      "Only after coaxing all three upper pivots into their ruby holes and verifying the bridge sits flat and spins freely",
      "After installing the hands",
      "While holding the balance wheel down",
    ],
    correctIndex: 1,
    explanation:
      "Tightening a bridge screw while a 0.07 mm pivot rests on a jewel edge snaps or bends the pivot instantly.",
    citation: "De Carle, Practical Watch Repairing, Ch. 6",
  },
  {
    id: "q18",
    question: "What role does the thin curved gold foil dial washer play under the dial?",
    options: [
      "Acts as a light axial spring keeping the hour wheel engaged in mesh with the minute wheel",
      "Insulates the watch from magnetism",
      "Seals the stem tube against water",
      "Adjusts beat error",
    ],
    correctIndex: 0,
    explanation:
      "Without the dial washer, axial play lets the hour wheel ride up under the dial and jump teeth against the minute wheel.",
    citation: "ETA 6497-1 Technical Sheet — Motion Works",
  },
  {
    id: "q19",
    question: "Which Moebius lubricant belongs on the ruby pallet stone impulse faces?",
    options: [
      "Moebius 8200",
      "Moebius 9415 thixotropic escapement grease",
      "Moebius 9501",
      "No lubricant — pallet stone impulse faces stay dry",
    ],
    correctIndex: 1,
    explanation:
      "Moebius 9415 shears thin during fast tooth impact and thickens instantly at rest so it stays right on the ruby impulse plane.",
    citation: "ETA 6497-1 Lubrication Chart",
  },
  {
    id: "q20",
    question: "How should a removed balance assembly be stored in the parts tray?",
    options: [
      "Mixed with bridge screws in Compartment 1",
      "Resting upside-down on the flat top of its balance cock in a dedicated compartment so the hairspring and lower pivot hang free",
      "Pressed into a ball of Rodico putty",
      "Submerged in Moebius 9010",
    ],
    correctIndex: 1,
    explanation:
      "Inverting the cock keeps the delicate hairspring coils and lower balance staff pivot suspended safely in air.",
    citation: "WOSTEP Bench Manual — Safe Storage of the Balance",
  },
] as const

export interface AskHenriReferenceCard {
  id: string
  topic: string
  keywords: readonly string[]
  questionPrompt: string
  answer: string
  citation: string
}

export const ASK_HENRI_CORPUS: readonly AskHenriReferenceCard[] = [
  {
    id: "ref-letdown",
    topic: "Mainspring Let-Down",
    keywords: ["mainspring", "let down", "click", "unwind", "power", "recoil", "wound"],
    questionPrompt: "Why must I let down the mainspring before lifting any bridge?",
    answer:
      "Because the wound Nivaflex barrel holds ~46 hours of torque locked only by the pallet stones. Lifting the pallet cock or train bridge under load spins the train uncontrollably and shears 0.07 mm pivots. Hold the crown with your thumb, hold click 425 back with pegwood, and ease the crown down smoothly.",
    citation: "ETA 6497-1 Service Sheet §2.1; De Carle Ch. 3",
  },
  {
    id: "ref-lefthand",
    topic: "Left-Hand Crown Wheel Screw",
    keywords: ["left", "crown wheel", "reverse", "three", "slot", "5420", "clockwise", "snap"],
    questionPrompt: "How do I recognize and loosen the left-hand screw on the barrel bridge?",
    answer:
      "Look at the crown wheel (ETA 420): its screw head has three parallel slots instead of one. That is the Swiss watchmaker's mark for a left-hand thread. Turn clockwise with the 1.40 mm grey screwdriver to loosen it, and counter-clockwise to tighten.",
    citation: "ETA 6497-1 Technical Sheet, Crown Wheel Screw 5420",
  },
  {
    id: "ref-oiling",
    topic: "6497-1 Lubrication Map",
    keywords: ["oil", "moebius", "9010", "hp1300", "d5", "9415", "8200", "9501", "dry", "lubricat", "meniscus"],
    questionPrompt: "Which Moebius oil goes where on the Unitas 6497-1, and what stays dry?",
    answer:
      "Mainspring wall: 8200. Barrel arbor & center wheel pivots (slow/high torque): HP1300. 3rd, 4th, escape pivots & Incabloc capstones (fast/low torque): 9010 filled to a 50 to 70% sink meniscus. Ruby pallet stone faces: 9415. Keyless steel-on-steel: 9501. Pallet staff pivots and dial train stay strictly dry.",
    citation: "ETA 6497-1 Official Lubrication Chart",
  },
  {
    id: "ref-timegrapher",
    topic: "Reading the Timegrapher",
    keywords: ["timegrapher", "amplitude", "beat error", "rate", "lift", "44", "trace", "snowstorm", "double"],
    questionPrompt: "How do I read rate, amplitude, and beat error on the 6497-1 timegrapher?",
    answer:
      "Set Lift Angle to 44.0° first. A rising trace means gaining (+ s/d); falling means losing (- s/d). Two parallel lines reveal Beat Error (target < 0.5 ms via stud/collet carrier). Healthy Dial-Up full-wind amplitude is 270° to 315°; vertical positions naturally read 20° to 30° lower due to radial pivot friction.",
    citation: "Witschi Chronoscope X1 Manual; ETA 6497-1 QC Sheet",
  },
  {
    id: "ref-magnetism",
    topic: "Magnetism & Racing Rate",
    keywords: ["magnet", "fast", "gain", "100", "cling", "demag", "coil", "hairspring"],
    questionPrompt: "Why is the movement suddenly gaining over +90 s/d?",
    answer:
      "Magnetized Nivarox coils attract one another, shortening the active oscillating length L of the hairspring. Because k scales inversely with L, stiffness jumps and period T drops. Run the movement slowly out of the tunnel demagnetizer before touching the regulator.",
    citation: "Fried, The Watch Repairer's Manual, Magnetism",
  },
  {
    id: "ref-stem",
    topic: "Stem Extraction & Keyless",
    keywords: ["stem", "setting lever", "1.5", "keyless", "yoke", "spring", "crown"],
    questionPrompt: "How far do I loosen the setting lever screw, and how do I keep the yoke spring from flying?",
    answer:
      "Loosen setting lever screw 5443 at most 1.5 turns with the 1.20 mm red blade; any further drops the dial-side setting lever off its threads. When servicing the dial-side keyless works, hold boxwood pegwood firmly down across yoke spring 440 before lifting.",
    citation: "ETA 6497-1 Technical Sheet, Note 5443; De Carle Ch. 8",
  },
  {
    id: "ref-pivots",
    topic: "Seating Going-Train Pivots",
    keywords: ["pivot", "train bridge", "seat", "snap", "bend", "third", "fourth", "escape"],
    questionPrompt: "How do I lower the going-train bridge without snapping a 0.07 mm pivot?",
    answer:
      "Rest the bridge lightly on its steady pins without touching a screwdriver. Hold gentle pegwood pressure on top while nudging the third, fourth, and escape wheels with fine tweezers until you feel all three upper pivots drop into their ruby holes and the bridge lies dead flush.",
    citation: "De Carle, Practical Watch Repairing, Ch. 6",
  },
] as const

export function queryAskHenri(query: string): {
  matched: boolean
  cards: AskHenriReferenceCard[]
  refusalNote?: string
} {
  const q = query.trim().toLowerCase()
  if (!q) {
    return { matched: true, cards: ASK_HENRI_CORPUS.slice(0, 3) }
  }
  const scored = ASK_HENRI_CORPUS.map((card) => {
    let score = 0
    if (card.topic.toLowerCase().includes(q)) score += 5
    for (const kw of card.keywords) {
      if (q.includes(kw)) score += 3
      else if (kw.includes(q) && q.length >= 3) score += 2
    }
    return { card, score }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return {
      matched: false,
      cards: [],
      refusalNote:
        "That topic sits outside Course 1's verified Unitas 6497-1 reference sheets. At this bench I only answer from reviewed technical documentation (ETA 6497-1 sheet, Moebius chart, Daniels, De Carle, Fried), never guesswork.",
    }
  }
  return {
    matched: true,
    cards: scored.slice(0, 2).map((s) => s.card),
  }
}
