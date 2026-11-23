// Photoreal Three.js macro Unitas / ETA 6497-1 movement builder.
// Every major assembly is tagged with userData.partId for raycasting, ghost guides,
// exploded-view axial separation, and real-time 10 kHz WASM kinematic updates.

import * as THREE from "three"
import { CALIBER_6497_PARTS } from "./caliber6497"
import { HOROLOGY_MATERIALS } from "./material-palette"
import type { HorologySnapshot } from "./physics"
import { createBenchStudioEnvMap, createHorologyTextures } from "./textures"

export interface MovementSceneController {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  rootGroup: THREE.Group
  partGroups: Map<string, THREE.Group>
  pickMeshes: THREE.Object3D[]
  updateFrame(
    snapshot: HorologySnapshot,
    options: {
      installedParts: ReadonlySet<string>
      selectedPartId: string | null
      hoveredPartId: string | null
      guidedPartId: string | null
      explodeAmount: number
      side: "movement" | "dial"
      overOiled: number
      oilQuality: number
    }
  ): void
  dispose(): void
}

function makeSpokedWheel(
  radius: number,
  thickness: number,
  toothCount: number,
  spokeCount: number,
  wheelMat: THREE.Material,
  steelMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group()

  // Unified toothed epicycloidal outer profile + spoked cutouts
  const visualTeeth = Math.min(toothCount, 52)
  const rootR = radius * 0.94
  const tipR = radius * 1.035
  const wheelShape = new THREE.Shape()

  for (let i = 0; i < visualTeeth; i++) {
    const a0 = (i / visualTeeth) * Math.PI * 2
    const step = (Math.PI * 2) / visualTeeth
    const rootStart = a0
    const flankUp = a0 + step * 0.24
    const tipStart = a0 + step * 0.34
    const tipEnd = a0 + step * 0.52
    const flankDown = a0 + step * 0.64
    if (i === 0) {
      wheelShape.moveTo(Math.cos(rootStart) * rootR, Math.sin(rootStart) * rootR)
    } else {
      wheelShape.lineTo(Math.cos(rootStart) * rootR, Math.sin(rootStart) * rootR)
    }
    wheelShape.lineTo(Math.cos(flankUp) * rootR, Math.sin(flankUp) * rootR)
    wheelShape.lineTo(Math.cos(tipStart) * tipR, Math.sin(tipStart) * tipR)
    wheelShape.lineTo(Math.cos(tipEnd) * tipR, Math.sin(tipEnd) * tipR)
    wheelShape.lineTo(Math.cos(flankDown) * rootR, Math.sin(flankDown) * rootR)
  }
  wheelShape.closePath()

  // Cut out sector windows between spokes
  const innerHubR = radius * 0.24
  const innerRimR = radius * 0.78
  const spokeHalfAng = 0.085
  for (let s = 0; s < spokeCount; s++) {
    const sa = (s / spokeCount) * Math.PI * 2 + spokeHalfAng
    const ea = ((s + 1) / spokeCount) * Math.PI * 2 - spokeHalfAng
    if (ea - sa <= 0.05) continue
    const win = new THREE.Path()
    win.moveTo(Math.cos(sa) * innerHubR, Math.sin(sa) * innerHubR)
    win.lineTo(Math.cos(sa) * innerRimR, Math.sin(sa) * innerRimR)
    win.absarc(0, 0, innerRimR, sa, ea, false)
    win.lineTo(Math.cos(ea) * innerHubR, Math.sin(ea) * innerHubR)
    win.absarc(0, 0, innerHubR, ea, sa, true)
    wheelShape.holes.push(win)
  }

  const wheelGeo = new THREE.ExtrudeGeometry(wheelShape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 16,
  })
  wheelGeo.translate(0, 0, -thickness * 0.5)
  g.add(new THREE.Mesh(wheelGeo, wheelMat))

  // Steel pinion + burnished arbor
  const pinion = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.15, radius * 0.15, thickness * 3.2, 20),
    steelMat
  )
  pinion.rotation.x = Math.PI * 0.5
  g.add(pinion)

  return g
}

function makeBluedScrew(
  headRadius: number,
  blueMat: THREE.Material,
  steelMat: THREE.Material,
  tripleSlotLeftHand = false
): THREE.Group {
  const g = new THREE.Group()
  const bevelCollar = new THREE.Mesh(
    new THREE.RingGeometry(headRadius * 1.02, headRadius * 1.24, 28),
    steelMat
  )
  bevelCollar.position.z = 0.01
  g.add(bevelCollar)

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(headRadius * 0.96, headRadius, 0.12, 28),
    blueMat
  )
  head.rotation.x = Math.PI * 0.5
  head.position.z = 0.06
  g.add(head)

  const slotGeo = new THREE.BoxGeometry(headRadius * 1.88, headRadius * 0.18, 0.05)
  const slotOffsets = tripleSlotLeftHand ? [-headRadius * 0.42, 0, headRadius * 0.42] : [0]
  for (const off of slotOffsets) {
    const slot = new THREE.Mesh(slotGeo, steelMat)
    slot.position.set(0, off, 0.115)
    g.add(slot)
  }
  return g
}

function makeRubyJewelWithSink(
  radius: number,
  rubyMat: THREE.Material,
  chatonMat: THREE.Material,
  steelMat: THREE.Material,
  oilMat: THREE.Material,
  includePivotTip = true
): { group: THREE.Group; oilRing: THREE.Mesh } {
  const group = new THREE.Group()
  // Proportioned gold chaton bezel flush with bridge sink
  const sink = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.08, radius * 0.13, 14, 36),
    chatonMat
  )
  sink.position.z = 0.04
  group.add(sink)

  // Deep crimson Verneuil corundum jewel body + convex oil-sink dome
  const ruby = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.98, radius * 0.96, 0.12, 32),
    rubyMat
  )
  ruby.rotation.x = Math.PI * 0.5
  ruby.position.z = 0.045
  group.add(ruby)

  const oilRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.28, radius * 0.68, 28),
    oilMat
  )
  oilRing.position.z = 0.112
  group.add(oilRing)

  if (includePivotTip) {
    const pivotEnd = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, 0.06, 18),
      steelMat
    )
    pivotEnd.rotation.x = Math.PI * 0.5
    pivotEnd.position.z = 0.095
    group.add(pivotEnd)
  }

  return { group, oilRing }
}

function tagHierarchyWithPartId(obj: THREE.Object3D, partId: string, pickList: THREE.Object3D[]) {
  obj.userData.partId = partId
  obj.traverse((child) => {
    child.userData.partId = partId
    if ((child as THREE.Mesh).isMesh) {
      pickList.push(child)
    }
  })
}

export function buildMovementScene(renderer: THREE.WebGLRenderer): MovementSceneController {
  const scene = new THREE.Scene()
  const envMap = createBenchStudioEnvMap(renderer)
  scene.environment = envMap

  const textures = createHorologyTextures()

  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.2, 180)
  camera.position.set(0, -14.5, 22.5)
  camera.lookAt(0, 0, 0)

  // Studio horological lighting: overhead warm bench diffuser + cool window edge + ruby fill
  const ambient = new THREE.AmbientLight(0xf6f3eb, 0.65)
  scene.add(ambient)

  const benchKey = new THREE.DirectionalLight(0xfff1d8, 2.35)
  benchKey.position.set(6, -8, 18)
  scene.add(benchKey)

  const northRim = new THREE.DirectionalLight(0xd9e8ff, 1.25)
  northRim.position.set(-12, 10, 11)
  scene.add(northRim)

  const dialSideLight = new THREE.DirectionalLight(0xfff4e2, 1.55)
  dialSideLight.position.set(4, 6, -18)
  scene.add(dialSideLight)

  // Bergeon green bench mat backdrop disk
  const matMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(34, 34, 0.6, 64),
    new THREE.MeshStandardMaterial({
      color: HOROLOGY_MATERIALS.bergeonMatDark,
      roughness: 0.88,
      metalness: 0.02,
    })
  )
  matMesh.rotation.x = Math.PI * 0.5
  matMesh.position.z = -3.8
  scene.add(matMesh)

  // Machined anodized movement holder ring cradling the 36.60mm mainplate
  const holderRing = new THREE.Mesh(
    new THREE.TorusGeometry(9.85, 0.52, 16, 64),
    new THREE.MeshStandardMaterial({
      color: 0x3b4441,
      metalness: 0.78,
      roughness: 0.34,
    })
  )
  holderRing.position.z = -0.2
  scene.add(holderRing)

  // Shared PBR materials
  const rhodiumPerlageMat = new THREE.MeshStandardMaterial({
    color: 0xe6eae8,
    map: textures.perlageColorMap,
    metalness: 0.84,
    roughness: 0.26,
    bumpMap: textures.perlageBump,
    bumpScale: 0.055,
    envMapIntensity: 1.35,
  })
  const rhodiumCotesMat = new THREE.MeshStandardMaterial({
    color: 0xecf0ee,
    map: textures.cotesColorMap,
    metalness: 0.86,
    roughness: 0.22,
    bumpMap: textures.cotesBump,
    bumpScale: 0.065,
    envMapIntensity: 1.45,
  })
  // Mirror-polished 45° anglage chamfer material on bridge bevels
  const mirrorAnglageMat = new THREE.MeshStandardMaterial({
    color: 0xf8faf9,
    metalness: 0.97,
    roughness: 0.06,
    envMapIntensity: 1.85,
  })
  const gildedBrassMat = new THREE.MeshStandardMaterial({
    color: HOROLOGY_MATERIALS.wheelBrass,
    metalness: 0.91,
    roughness: 0.2,
    envMapIntensity: 1.4,
  })
  const glucydurMat = new THREE.MeshStandardMaterial({
    color: HOROLOGY_MATERIALS.glucydurBrass,
    metalness: 0.94,
    roughness: 0.14,
    envMapIntensity: 1.5,
  })
  const polishedSteelMat = new THREE.MeshStandardMaterial({
    color: HOROLOGY_MATERIALS.temperedSteel,
    metalness: 0.95,
    roughness: 0.12,
    envMapIntensity: 1.55,
  })
  const sunburstSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e7e9,
    map: textures.sunburstColorMap,
    metalness: 0.9,
    roughness: 0.2,
    bumpMap: textures.sunburstBump,
    bumpScale: 0.045,
    envMapIntensity: 1.45,
  })
  const bluedScrewMat = new THREE.MeshStandardMaterial({
    color: HOROLOGY_MATERIALS.bluedSteelScrew,
    metalness: 0.92,
    roughness: 0.12,
    envMapIntensity: 1.5,
  })
  const bluedHandMat = new THREE.MeshStandardMaterial({
    color: HOROLOGY_MATERIALS.bluedHandSteel,
    metalness: 0.9,
    roughness: 0.14,
    envMapIntensity: 1.5,
  })
  // Verneuil synthetic corundum — deep wine-crimson clearcoat with dark oil sink
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0x8c0b29,
    emissive: 0x2b020c,
    emissiveIntensity: 0.06,
    metalness: 0.08,
    roughness: 0.11,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
    envMapIntensity: 1.8,
  })
  const oilMeniscusMat = new THREE.MeshBasicMaterial({
    color: HOROLOGY_MATERIALS.oilMeniscusClean,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
  })
  const nivaroxMat = new THREE.MeshStandardMaterial({
    color: 0xd8e2ea,
    metalness: 0.92,
    roughness: 0.16,
    side: THREE.DoubleSide,
    envMapIntensity: 1.5,
  })
  const dialEnamelMat = new THREE.MeshStandardMaterial({
    map: textures.dialColorMap,
    roughness: 0.14,
    metalness: 0.04,
  })
  const sapphireMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.82,
    ior: 1.77,
  })

  const rootGroup = new THREE.Group()
  scene.add(rootGroup)

  const partGroups = new Map<string, THREE.Group>()
  const baseZByPart = new Map<string, number>()
  const explodeZByPart = new Map<string, number>()
  const pickMeshes: THREE.Object3D[] = []
  const oilRings: THREE.Mesh[] = []

  for (const spec of CALIBER_6497_PARTS) {
    explodeZByPart.set(spec.id, spec.explodeZ)
  }

  // 1. Mainplate (Ø 36.60 mm -> radius 9.15)
  const mainplateGroup = new THREE.Group()
  const plateMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(9.15, 9.15, 0.65, 72),
    rhodiumPerlageMat.clone()
  )
  plateMesh.rotation.x = Math.PI * 0.5
  mainplateGroup.add(plateMesh)
  // Recessed dark perlage pockets for barrel and balance
  for (const [px, py, pr] of [
    [-2.9, 2.7, 3.8],
    [4.6, -3.0, 3.3],
    [-1.4, -2.0, 3.2],
  ]) {
    const pocket = new THREE.Mesh(
      new THREE.CylinderGeometry(pr, pr, 0.68, 44),
      new THREE.MeshStandardMaterial({
        color: 0xaab2af,
        map: textures.perlageColorMap,
        metalness: 0.82,
        roughness: 0.32,
        bumpMap: textures.perlageBump,
        bumpScale: 0.06,
      })
    )
    pocket.rotation.x = Math.PI * 0.5
    pocket.position.set(px, py, 0.02)
    mainplateGroup.add(pocket)
  }
  partGroups.set("mainplate", mainplateGroup)
  baseZByPart.set("mainplate", 0)

  // 2. Center wheel (at [0, 0])
  const centerWheelGroup = new THREE.Group()
  const centerWheelSpinner = makeSpokedWheel(
    2.55,
    0.16,
    40,
    4,
    gildedBrassMat.clone(),
    polishedSteelMat
  )
  centerWheelGroup.add(centerWheelSpinner)
  partGroups.set("center_wheel", centerWheelGroup)
  baseZByPart.set("center_wheel", 0.48)

  // 3. Mainspring barrel (at [-2.9, 2.7])
  const barrelGroup = new THREE.Group()
  barrelGroup.position.set(-2.9, 2.7, 0)
  const barrelSpinner = new THREE.Group()
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(3.38, 3.38, 0.6, 56),
    gildedBrassMat.clone()
  )
  drum.rotation.x = Math.PI * 0.5
  barrelSpinner.add(drum)
  const barrelTeeth = makeSpokedWheel(3.48, 0.16, 48, 3, gildedBrassMat, polishedSteelMat)
  barrelTeeth.position.z = -0.22
  barrelSpinner.add(barrelTeeth)
  barrelGroup.add(barrelSpinner)
  partGroups.set("mainspring_barrel", barrelGroup)
  baseZByPart.set("mainspring_barrel", 0.56)

  // 4. Barrel bridge + Ratchet + Left-Hand Crown Wheel
  const barrelBridgeGroup = new THREE.Group()
  const bbShape = new THREE.Shape()
  bbShape.moveTo(-7.6, 0.4)
  bbShape.quadraticCurveTo(-7.2, 6.9, -0.4, 7.6)
  bbShape.quadraticCurveTo(3.8, 7.2, 4.4, 2.2)
  bbShape.quadraticCurveTo(1.8, -0.9, -2.2, -0.7)
  bbShape.quadraticCurveTo(-6.2, -0.8, -7.6, 0.4)
  const bbGeo = new THREE.ExtrudeGeometry(bbShape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSize: 0.065,
    bevelThickness: 0.065,
    bevelSegments: 4,
    curveSegments: 32,
  })
  barrelBridgeGroup.add(
    new THREE.Mesh(bbGeo, [rhodiumCotesMat.clone(), mirrorAnglageMat.clone()])
  )

  // Ratchet wheel on barrel arbor
  const ratchetMesh = makeSpokedWheel(
    2.48,
    0.16,
    48,
    1,
    sunburstSteelMat.clone(),
    polishedSteelMat
  )
  ratchetMesh.position.set(-2.9, 2.7, 0.58)
  barrelBridgeGroup.add(ratchetMesh)
  const ratchetDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.34, 2.34, 0.17, 48),
    sunburstSteelMat.clone()
  )
  ratchetDisc.rotation.x = Math.PI * 0.5
  ratchetDisc.position.set(-2.9, 2.7, 0.58)
  barrelBridgeGroup.add(ratchetDisc)
  const ratchetScrew = makeBluedScrew(0.4, bluedScrewMat, polishedSteelMat, false)
  ratchetScrew.position.set(-2.9, 2.7, 0.67)
  barrelBridgeGroup.add(ratchetScrew)

  // Crown wheel + TRIPLE-SLOTTED LEFT-HAND SCREW
  const crownWheelMesh = makeSpokedWheel(
    1.8,
    0.16,
    38,
    1,
    sunburstSteelMat.clone(),
    polishedSteelMat
  )
  crownWheelMesh.position.set(1.6, 4.5, 0.58)
  barrelBridgeGroup.add(crownWheelMesh)
  const crownDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.68, 1.68, 0.17, 40),
    sunburstSteelMat.clone()
  )
  crownDisc.rotation.x = Math.PI * 0.5
  crownDisc.position.set(1.6, 4.5, 0.58)
  barrelBridgeGroup.add(crownDisc)
  const leftHandCrownScrew = makeBluedScrew(0.44, bluedScrewMat, polishedSteelMat, true)
  leftHandCrownScrew.position.set(1.6, 4.5, 0.67)
  barrelBridgeGroup.add(leftHandCrownScrew)

  // Upper center jewel + 3 blued 1.40mm bridge screws (flush above bevel top z = 0.485)
  const centerUpperJewel = makeRubyJewelWithSink(
    0.42,
    rubyMat,
    glucydurMat,
    polishedSteelMat,
    oilMeniscusMat
  )
  centerUpperJewel.group.position.set(0, 0, 0.495)
  oilRings.push(centerUpperJewel.oilRing)
  barrelBridgeGroup.add(centerUpperJewel.group)

  for (const [sx, sy] of [
    [-6.1, 1.4],
    [-1.2, 6.4],
    [3.1, 2.3],
  ]) {
    const sc = makeBluedScrew(0.34, bluedScrewMat, polishedSteelMat)
    sc.position.set(sx, sy, 0.49)
    barrelBridgeGroup.add(sc)
  }
  partGroups.set("barrel_bridge", barrelBridgeGroup)
  baseZByPart.set("barrel_bridge", 0.96)

  // 5. Stored Mainspring Power / Click 425 indicator
  const clickPowerGroup = new THREE.Group()
  const clickArm = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.32, 0.16),
    polishedSteelMat.clone()
  )
  clickArm.position.set(-5.55, 4.35, 0.58)
  clickArm.rotation.z = 0.52
  clickPowerGroup.add(clickArm)
  const clickScrew = makeBluedScrew(0.26, bluedScrewMat, polishedSteelMat)
  clickScrew.position.set(-6.0, 4.1, 0.64)
  clickPowerGroup.add(clickScrew)
  partGroups.set("mainspring_power", clickPowerGroup)
  baseZByPart.set("mainspring_power", 0.98)

  // 6. Third wheel ([-1.5, -2.2])
  const thirdWheelGroup = new THREE.Group()
  thirdWheelGroup.position.set(-1.5, -2.2, 0)
  const thirdWheelSpinner = makeSpokedWheel(
    1.95,
    0.14,
    38,
    4,
    gildedBrassMat.clone(),
    polishedSteelMat
  )
  thirdWheelGroup.add(thirdWheelSpinner)
  partGroups.set("third_wheel", thirdWheelGroup)
  baseZByPart.set("third_wheel", 0.52)

  // 7. Fourth wheel at 9 o'clock ([-4.7, 0.0])
  const fourthWheelGroup = new THREE.Group()
  fourthWheelGroup.position.set(-4.7, 0.0, 0)
  const fourthWheelSpinner = makeSpokedWheel(
    2.02,
    0.14,
    40,
    4,
    gildedBrassMat.clone(),
    polishedSteelMat
  )
  fourthWheelGroup.add(fourthWheelSpinner)
  partGroups.set("fourth_wheel", fourthWheelGroup)
  baseZByPart.set("fourth_wheel", 0.62)

  // 8. 15-Tooth Club-Tooth Escape Wheel ([1.4, -3.1])
  const escapeWheelGroup = new THREE.Group()
  escapeWheelGroup.position.set(1.4, -3.1, 0)
  const escapeWheelSpinner = makeSpokedWheel(
    1.46,
    0.12,
    15,
    3,
    polishedSteelMat.clone(),
    polishedSteelMat
  )
  escapeWheelGroup.add(escapeWheelSpinner)
  partGroups.set("escape_wheel", escapeWheelGroup)
  baseZByPart.set("escape_wheel", 0.58)

  // 9. Going-Train Bridge (ETA 110) with 3 crimson synthetic rubies + mirror anglage
  const trainBridgeGroup = new THREE.Group()
  const tbShape = new THREE.Shape()
  tbShape.moveTo(-6.8, 1.3)
  tbShape.quadraticCurveTo(-7.2, -2.8, -3.4, -5.8)
  tbShape.quadraticCurveTo(0.8, -6.9, 2.8, -4.1)
  tbShape.quadraticCurveTo(2.4, -1.5, -1.6, -0.8)
  tbShape.quadraticCurveTo(-4.8, 1.6, -6.8, 1.3)
  const tbGeo = new THREE.ExtrudeGeometry(tbShape, {
    depth: 0.38,
    bevelEnabled: true,
    bevelSize: 0.055,
    bevelThickness: 0.055,
    bevelSegments: 4,
    curveSegments: 32,
  })
  trainBridgeGroup.add(
    new THREE.Mesh(tbGeo, [rhodiumCotesMat.clone(), mirrorAnglageMat.clone()])
  )

  for (const [jx, jy] of [
    [-1.5, -2.2],
    [-4.7, 0.0],
    [1.4, -3.1],
  ]) {
    const jw = makeRubyJewelWithSink(
      0.36,
      rubyMat,
      glucydurMat,
      polishedSteelMat,
      oilMeniscusMat
    )
    jw.group.position.set(jx, jy, 0.45)
    oilRings.push(jw.oilRing)
    trainBridgeGroup.add(jw.group)
  }
  for (const [sx, sy] of [
    [-5.8, -1.9],
    [-0.9, -5.2],
  ]) {
    const sc = makeBluedScrew(0.32, bluedScrewMat, polishedSteelMat)
    sc.position.set(sx, sy, 0.445)
    trainBridgeGroup.add(sc)
  }
  partGroups.set("train_bridge", trainBridgeGroup)
  baseZByPart.set("train_bridge", 1.02)

  // 10. Pallet Cock & Swiss Lever Fork ([2.9, -1.5])
  const palletGroup = new THREE.Group()
  palletGroup.position.set(2.9, -1.5, 0)
  const palletForkRocker = new THREE.Group()
  const forkBeam = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.18, 0.11),
    polishedSteelMat.clone()
  )
  forkBeam.rotation.z = 0.55
  palletForkRocker.add(forkBeam)
  // Entry & exit synthetic ruby pallet stones
  for (const [rx, ry] of [
    [-0.78, -0.78],
    [-0.45, -1.18],
  ]) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.13), rubyMat)
    stone.position.set(rx, ry, 0)
    palletForkRocker.add(stone)
  }
  palletGroup.add(palletForkRocker)

  const pcShape = new THREE.Shape()
  pcShape.absarc(0, 0, 1.35, 0, Math.PI * 2, false)
  const pcGeo = new THREE.ExtrudeGeometry(pcShape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelSize: 0.045,
    bevelThickness: 0.045,
    bevelSegments: 3,
  })
  const pcMesh = new THREE.Mesh(pcGeo, [
    rhodiumPerlageMat.clone(),
    mirrorAnglageMat.clone(),
  ])
  pcMesh.position.z = 0.22
  palletGroup.add(pcMesh)
  const palletJewel = makeRubyJewelWithSink(
    0.28,
    rubyMat,
    glucydurMat,
    polishedSteelMat,
    oilMeniscusMat
  )
  palletJewel.group.position.set(0, 0, 0.555)
  palletJewel.oilRing.visible = false // Pallet pivots stay strictly dry
  palletGroup.add(palletJewel.group)
  for (const [sx, sy] of [
    [-0.72, 0.65],
    [0.78, -0.55],
  ]) {
    const sc = makeBluedScrew(0.25, bluedScrewMat, polishedSteelMat)
    sc.position.set(sx, sy, 0.555)
    palletGroup.add(sc)
  }
  partGroups.set("pallet_cock_fork", palletGroup)
  baseZByPart.set("pallet_cock_fork", 0.72)

  // 11. Balance Assembly: Glucydur Wheel + Smooth Metallic Nivarox Ribbon + Cock + Incabloc Lyre ([4.7, -2.8])
  const balanceGroup = new THREE.Group()
  balanceGroup.position.set(4.7, -2.8, 0)

  const balanceWheelOscillator = new THREE.Group()
  const balRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.98, 0.2, 18, 84),
    glucydurMat.clone()
  )
  balanceWheelOscillator.add(balRim)
  const balArms = new THREE.Mesh(
    new THREE.BoxGeometry(5.85, 0.22, 0.1),
    glucydurMat
  )
  balanceWheelOscillator.add(balArms)
  const colletHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.34, 24),
    glucydurMat
  )
  colletHub.rotation.x = Math.PI * 0.5
  balanceWheelOscillator.add(colletHub)

  // 16 timing poise screws around the Glucydur rim
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const poiseScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.095, 0.24, 12),
      glucydurMat
    )
    poiseScrew.position.set(Math.cos(a) * 3.18, Math.sin(a) * 3.18, 0)
    poiseScrew.rotation.z = a + Math.PI * 0.5
    balanceWheelOscillator.add(poiseScrew)
  }
  balanceGroup.add(balanceWheelOscillator)

  // Smooth 720-sample metallic Nivarox 1 flat ribbon spiral (62 vertices per coil, zero polygon kinks)
  const spiralSamples = 720
  const spiralPositions = new Float32Array(spiralSamples * 2 * 3)
  const spiralNormals = new Float32Array(spiralSamples * 2 * 3)
  const spiralIndices: number[] = []
  for (let i = 0; i < spiralSamples - 1; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = (i + 1) * 2
    const d = (i + 1) * 2 + 1
    spiralIndices.push(a, b, c, b, d, c)
  }
  for (let v = 0; v < spiralSamples * 2; v++) {
    spiralNormals[v * 3 + 2] = 1
  }
  const spiralGeo = new THREE.BufferGeometry()
  spiralGeo.setAttribute("position", new THREE.BufferAttribute(spiralPositions, 3))
  spiralGeo.setAttribute("normal", new THREE.BufferAttribute(spiralNormals, 3))
  spiralGeo.setIndex(spiralIndices)
  const spiralRibbon = new THREE.Mesh(spiralGeo, nivaroxMat)
  spiralRibbon.position.z = 0.24
  balanceGroup.add(spiralRibbon)

  // Sculpted Balance Cock + Côtes de Genève + mirror anglage
  const bcShape = new THREE.Shape()
  bcShape.moveTo(-0.9, -0.9)
  bcShape.quadraticCurveTo(1.8, -1.6, 3.6, 1.8)
  bcShape.quadraticCurveTo(3.9, 4.5, 1.4, 5.2)
  bcShape.quadraticCurveTo(-0.4, 3.2, -0.9, 0.9)
  bcShape.quadraticCurveTo(-1.3, 0.0, -0.9, -0.9)
  const bcGeo = new THREE.ExtrudeGeometry(bcShape, {
    depth: 0.36,
    bevelEnabled: true,
    bevelSize: 0.055,
    bevelThickness: 0.055,
    bevelSegments: 4,
    curveSegments: 28,
  })
  const bcMesh = new THREE.Mesh(bcGeo, [
    rhodiumCotesMat.clone(),
    mirrorAnglageMat.clone(),
  ])
  bcMesh.position.z = 0.45
  balanceGroup.add(bcMesh)

  const incablocJewel = makeRubyJewelWithSink(
    0.42,
    rubyMat,
    glucydurMat,
    polishedSteelMat,
    oilMeniscusMat,
    false // Capstone ruby has continuous flat dome over pivot
  )
  incablocJewel.group.position.set(0, 0, 0.875)
  oilRings.push(incablocJewel.oilRing)
  balanceGroup.add(incablocJewel.group)

  // Authentic Incabloc brass lyre spring arcs cradling the ruby capstone
  for (const sideSign of [-1, 1]) {
    const lyreArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.036, 10, 28, Math.PI * 0.78),
      glucydurMat
    )
    lyreArc.rotation.z = sideSign > 0 ? 0.38 : Math.PI + 0.38
    lyreArc.position.set(0, 0, 0.96)
    balanceGroup.add(lyreArc)
  }

  // Concentric polished steel Regulator Index Collar & Pointer (never crossing the jewel)
  const regulatorAssembly = new THREE.Group()
  regulatorAssembly.position.set(0, 0, 0.89)
  const regCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.065, 12, 36),
    polishedSteelMat
  )
  regulatorAssembly.add(regCollar)
  const regIndexTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.85, 12),
    polishedSteelMat
  )
  regIndexTip.rotation.z = Math.PI * 0.72
  regIndexTip.position.set(-0.92, 0.56, 0)
  regulatorAssembly.add(regIndexTip)

  // Stud holder arm on opposite quadrant over outer coil
  const studCarrier = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.14, 0.08),
    polishedSteelMat
  )
  studCarrier.position.set(-0.88, -0.44, 0)
  studCarrier.rotation.z = 0.45
  regulatorAssembly.add(studCarrier)
  balanceGroup.add(regulatorAssembly)

  const cockScrew = makeBluedScrew(0.36, bluedScrewMat, polishedSteelMat)
  cockScrew.position.set(2.3, 3.5, 0.87)
  balanceGroup.add(cockScrew)

  partGroups.set("balance_assembly", balanceGroup)
  baseZByPart.set("balance_assembly", 0.62)

  // 12. Winding Stem & Onion Crown at 3 o'clock ([9.2, 0])
  const stemGroup = new THREE.Group()
  const stemShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 5.4, 18),
    polishedSteelMat.clone()
  )
  stemShaft.rotation.z = Math.PI * 0.5
  stemShaft.position.set(9.4, 0, 0.1)
  stemGroup.add(stemShaft)
  const onionCrown = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 28, 18),
    glucydurMat.clone()
  )
  onionCrown.scale.set(0.68, 1.0, 1.0)
  onionCrown.position.set(12.2, 0, 0.1)
  stemGroup.add(onionCrown)
  partGroups.set("stem_crown", stemGroup)
  baseZByPart.set("stem_crown", 0)

  // 13. Keyless Works (dial side at [6.2, 1.2])
  const keylessGroup = new THREE.Group()
  const yokePlate = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.5, 0.22),
    polishedSteelMat.clone()
  )
  yokePlate.position.set(5.8, 1.1, -0.58)
  keylessGroup.add(yokePlate)
  const jumperArc = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.09, 10, 24, Math.PI * 1.3),
    bluedScrewMat.clone()
  )
  jumperArc.position.set(5.4, -0.5, -0.58)
  keylessGroup.add(jumperArc)
  partGroups.set("keyless_works", keylessGroup)
  baseZByPart.set("keyless_works", 0)

  // 14. Motion Works: Hour Wheel, Cannon Pinion & Convex Foil Washer (dial side center)
  const motionWorksGroup = new THREE.Group()
  const hourWheel = makeSpokedWheel(2.3, 0.16, 36, 4, gildedBrassMat.clone(), polishedSteelMat)
  hourWheel.position.z = -0.62
  motionWorksGroup.add(hourWheel)
  const foilWasher = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 1.25, 32),
    glucydurMat.clone()
  )
  foilWasher.position.z = -0.76
  motionWorksGroup.add(foilWasher)
  partGroups.set("hour_wheel_cannon", motionWorksGroup)
  baseZByPart.set("hour_wheel_cannon", 0)

  // 15. Grand Feu White Enamel Dial (dial side)
  const dialGroup = new THREE.Group()
  const dialDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(9.28, 9.28, 0.26, 72),
    [polishedSteelMat, polishedSteelMat, dialEnamelMat]
  )
  dialDisk.rotation.x = -Math.PI * 0.5
  dialDisk.rotation.y = Math.PI
  dialDisk.position.z = -1.02
  dialGroup.add(dialDisk)
  partGroups.set("dial_plate", dialGroup)
  baseZByPart.set("dial_plate", 0)

  // 16. Blued Steel Poire Hands & 9H Small-Seconds Hand (dial side)
  const handsGroup = new THREE.Group()
  const hourHandPivot = new THREE.Group()
  const hourBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 4.4, 0.08),
    bluedHandMat.clone()
  )
  hourBlade.position.y = 1.9
  hourHandPivot.add(hourBlade)
  hourHandPivot.rotation.z = -0.85
  hourHandPivot.position.z = -1.26
  handsGroup.add(hourHandPivot)

  const minuteHandPivot = new THREE.Group()
  const minBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 6.9, 0.08),
    bluedHandMat.clone()
  )
  minBlade.position.y = 3.1
  minuteHandPivot.add(minBlade)
  minuteHandPivot.rotation.z = 0.52
  minuteHandPivot.position.z = -1.36
  handsGroup.add(minuteHandPivot)

  const secondsHandPivot = new THREE.Group()
  const secBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 2.1, 0.06),
    bluedHandMat.clone()
  )
  secBlade.position.y = 0.75
  secondsHandPivot.add(secBlade)
  // On dial side (viewed from -Z), 9H subdial sits at +4.45 or -4.45 depending on flip
  secondsHandPivot.position.set(4.35, 0, -1.32)
  handsGroup.add(secondsHandPivot)
  partGroups.set("hands_set", handsGroup)
  baseZByPart.set("hands_set", 0)

  // 17. Exhibition Sapphire Caseback bezel (movement side)
  const caseBackGroup = new THREE.Group()
  const bezelRing = new THREE.Mesh(
    new THREE.TorusGeometry(9.65, 0.36, 18, 72),
    polishedSteelMat.clone()
  )
  bezelRing.position.z = 1.85
  caseBackGroup.add(bezelRing)
  const crystalDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(9.45, 9.45, 0.12, 64),
    sapphireMat
  )
  crystalDisk.rotation.x = Math.PI * 0.5
  crystalDisk.position.z = 1.88
  caseBackGroup.add(crystalDisk)
  partGroups.set("case_back", caseBackGroup)
  baseZByPart.set("case_back", 0)

  // Attach and tag all 17 part groups
  for (const [partId, grp] of partGroups.entries()) {
    tagHierarchyWithPartId(grp, partId, pickMeshes)
    rootGroup.add(grp)
  }

  function updateSpiralGeometry(balanceAngle: number) {
    const turns = 11.5
    const rInner = 0.56
    const rOuter = 2.18
    const ribbonHalfW = 0.022
    const breathe = 1.0 + 0.042 * Math.sin(balanceAngle * 0.32)
    for (let i = 0; i < spiralSamples; i++) {
      const u = i / (spiralSamples - 1)
      const baseTheta = u * turns * Math.PI * 2 + balanceAngle * (1.0 - u)
      const rCenter = rInner + (rOuter - rInner) * u * (0.86 + 0.14 * breathe)
      const cosT = Math.cos(baseTheta)
      const sinT = Math.sin(baseTheta)
      const r0 = rCenter - ribbonHalfW
      const r1 = rCenter + ribbonHalfW
      const idx0 = i * 6
      spiralPositions[idx0] = cosT * r0
      spiralPositions[idx0 + 1] = sinT * r0
      spiralPositions[idx0 + 2] = 0
      spiralPositions[idx0 + 3] = cosT * r1
      spiralPositions[idx0 + 4] = sinT * r1
      spiralPositions[idx0 + 5] = 0.035
    }
    spiralGeo.attributes.position.needsUpdate = true
  }
  updateSpiralGeometry(0)

  return {
    scene,
    camera,
    rootGroup,
    partGroups,
    pickMeshes,
    updateFrame(snapshot, options) {
      // Flip smoothly between movement side (0) and dial side (pi around Y)
      const targetRotY = options.side === "dial" ? Math.PI : 0
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.18

      // Update live kinematics from 10 kHz WASM snapshot
      balanceWheelOscillator.rotation.z = snapshot.balanceAngleRad
      updateSpiralGeometry(snapshot.balanceAngleRad)
      palletForkRocker.rotation.z = snapshot.palletAngleRad * 1.4
      escapeWheelSpinner.rotation.z = -snapshot.escapeWheelAngleRad
      fourthWheelSpinner.rotation.z = snapshot.fourthWheelAngleRad
      thirdWheelSpinner.rotation.z = -snapshot.thirdWheelAngleRad
      centerWheelSpinner.rotation.z = snapshot.centerWheelAngleRad
      barrelSpinner.rotation.z = -snapshot.barrelAngleRad
      secondsHandPivot.rotation.z = -snapshot.fourthWheelAngleRad
      minuteHandPivot.rotation.z = 0.52 - snapshot.centerWheelAngleRad

      // Oil meniscus ring appearance
      const meniscusScale =
        options.overOiled > 0.4
          ? 1.45
          : options.oilQuality < 0.45
            ? 0.35
            : 1.0
      oilMeniscusMat.color.setHex(
        options.overOiled > 0.4
          ? HOROLOGY_MATERIALS.oilMeniscusFlooded
          : HOROLOGY_MATERIALS.oilMeniscusClean
      )
      oilMeniscusMat.opacity = options.oilQuality < 0.45 ? 0.18 : 0.65
      for (const ring of oilRings) {
        ring.scale.setScalar(meniscusScale)
      }

      // Visibility, axial exploded offset, and subtle selection/guide highlight
      for (const [partId, grp] of partGroups.entries()) {
        const isInstalled = options.installedParts.has(partId)
        const isGuidedGhost = !isInstalled && options.guidedPartId === partId
        grp.visible = isInstalled || isGuidedGhost

        const baseZ = baseZByPart.get(partId) ?? 0
        const expZ = explodeZByPart.get(partId) ?? 0
        grp.position.z = baseZ + expZ * options.explodeAmount * 1.35

        const isHighlighted =
          partId === options.selectedPartId ||
          partId === options.hoveredPartId ||
          partId === options.guidedPartId

        grp.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (!mesh.isMesh) return
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          for (const rawMat of mats) {
            const mat = rawMat as THREE.MeshStandardMaterial
            if (!mat || !("emissive" in mat) || rawMat === rubyMat) continue
            if (isGuidedGhost) {
              mat.transparent = true
              mat.opacity = 0.38
              mat.emissive.setHex(HOROLOGY_MATERIALS.highlightGold)
              mat.emissiveIntensity = 0.35
            } else {
              if (rawMat !== sapphireMat && rawMat !== oilMeniscusMat) {
                mat.transparent = false
                mat.opacity = 1.0
              }
              if (isHighlighted) {
                mat.emissive.setHex(HOROLOGY_MATERIALS.highlightGold)
                mat.emissiveIntensity =
                  partId === options.guidedPartId ? 0.24 : 0.14
              } else {
                mat.emissive.setHex(0x000000)
                mat.emissiveIntensity = 0
              }
            }
          }
        })
      }
    },
    dispose() {
      textures.dispose()
      envMap.dispose()
    },
  }
}
