// Procedural macro horological textures:
// 1. Côtes de Genève (Geneva stripes) anisotropic bump/roughness map for rhodium bridges
// 2. Concentric Perlage (circular graining) map for the 36.60 mm mainplate
// 3. Sunburst / Snailing radial brush map for steel ratchet & crown wheels
// 4. Grand Feu white enamel 6497-1 dial texture with Roman chapter ring & 9H small seconds
// 5. Studio horological softbox equirectangular environment texture

import * as THREE from "three"
import { rgbCss, HOROLOGY_MATERIALS } from "./material-palette"

export interface HorologyTextureSet {
  cotesColorMap: THREE.CanvasTexture
  cotesBump: THREE.CanvasTexture
  perlageColorMap: THREE.CanvasTexture
  perlageBump: THREE.CanvasTexture
  sunburstColorMap: THREE.CanvasTexture
  sunburstBump: THREE.CanvasTexture
  dialColorMap: THREE.CanvasTexture
  dispose(): void
}

export function createHorologyTextures(): HorologyTextureSet {
  // 1. Côtes de Genève (Geneva stripes) — paired sRGB brushed rhodium map + bump map
  const cotesCanvas = document.createElement("canvas")
  cotesCanvas.width = 1024
  cotesCanvas.height = 1024
  const cCtx = cotesCanvas.getContext("2d")!
  cCtx.fillStyle = rgbCss(0xc8ccca)
  cCtx.fillRect(0, 0, 1024, 1024)

  const stripeCount = 8
  const stripeW = 1024 / stripeCount
  for (let s = 0; s < stripeCount; s++) {
    const x0 = s * stripeW
    const grad = cCtx.createLinearGradient(x0, 0, x0 + stripeW, 0)
    grad.addColorStop(0.0, rgbCss(0x8e9492))
    grad.addColorStop(0.06, rgbCss(0xdde1df))
    grad.addColorStop(0.32, rgbCss(0xcfd4d2))
    grad.addColorStop(0.58, rgbCss(0xe6eae8))
    grad.addColorStop(0.92, rgbCss(0xb8bdbc))
    grad.addColorStop(1.0, rgbCss(0x828886))
    cCtx.fillStyle = grad
    cCtx.fillRect(x0, 0, stripeW, 1024)

    // Fine abrasive wheel arc lines inside each Geneva rib
    for (let y = -96; y < 1120; y += 5) {
      cCtx.strokeStyle =
        y % 10 === 0 ? rgbCss(0xffffff, 0.22) : rgbCss(0x6e7472, 0.16)
      cCtx.lineWidth = 1.15
      cCtx.beginPath()
      cCtx.moveTo(x0, y)
      cCtx.quadraticCurveTo(x0 + stripeW * 0.5, y + 18, x0 + stripeW, y)
      cCtx.stroke()
    }

    // Crisp rib boundary line
    cCtx.strokeStyle = rgbCss(0x6c7270, 0.55)
    cCtx.lineWidth = 1.6
    cCtx.beginPath()
    cCtx.moveTo(x0, 0)
    cCtx.lineTo(x0, 1024)
    cCtx.stroke()
  }

  const cotesColorMap = new THREE.CanvasTexture(cotesCanvas)
  cotesColorMap.colorSpace = THREE.SRGBColorSpace
  cotesColorMap.wrapS = THREE.RepeatWrapping
  cotesColorMap.wrapT = THREE.RepeatWrapping
  cotesColorMap.repeat.set(0.12, 0.12)
  cotesColorMap.rotation = 0.42

  const cotesBump = new THREE.CanvasTexture(cotesCanvas)
  cotesBump.wrapS = THREE.RepeatWrapping
  cotesBump.wrapT = THREE.RepeatWrapping
  cotesBump.repeat.set(0.12, 0.12)
  cotesBump.rotation = 0.42

  // 2. Perlage overlapping circular graining for mainplate & recesses
  const perlCanvas = document.createElement("canvas")
  perlCanvas.width = 1024
  perlCanvas.height = 1024
  const pCtx = perlCanvas.getContext("2d")!
  pCtx.fillStyle = rgbCss(0xb7bcba)
  pCtx.fillRect(0, 0, 1024, 1024)
  const step = 44
  for (let y = 0; y <= 1024 + step; y += step * 0.68) {
    const offset = (Math.round(y / (step * 0.68)) % 2) * (step * 0.5)
    for (let x = -step; x <= 1024 + step; x += step) {
      const cx = x + offset
      const discGrad = pCtx.createRadialGradient(cx - 4, y - 4, 2, cx, y, 24)
      discGrad.addColorStop(0, rgbCss(0xdce0de, 0.65))
      discGrad.addColorStop(0.7, rgbCss(0xbac0be, 0.45))
      discGrad.addColorStop(1, rgbCss(0x888e8c, 0.55))
      pCtx.fillStyle = discGrad
      pCtx.beginPath()
      pCtx.arc(cx, y, 24, 0, Math.PI * 2)
      pCtx.fill()

      for (let r = 5; r <= 23; r += 3.5) {
        pCtx.strokeStyle =
          Math.round(r) % 2 === 0
            ? rgbCss(0xf2f5f4, 0.34)
            : rgbCss(0x6e7472, 0.28)
        pCtx.lineWidth = 1.1
        pCtx.beginPath()
        pCtx.arc(cx, y, r, 0, Math.PI * 2)
        pCtx.stroke()
      }
    }
  }
  const perlageColorMap = new THREE.CanvasTexture(perlCanvas)
  perlageColorMap.colorSpace = THREE.SRGBColorSpace
  perlageColorMap.wrapS = THREE.RepeatWrapping
  perlageColorMap.wrapT = THREE.RepeatWrapping
  perlageColorMap.repeat.set(3.2, 3.2)

  const perlageBump = new THREE.CanvasTexture(perlCanvas)
  perlageBump.wrapS = THREE.RepeatWrapping
  perlageBump.wrapT = THREE.RepeatWrapping
  perlageBump.repeat.set(3.2, 3.2)

  // 3. Sunburst / Snailing on steel ratchet & crown wheels
  const sunCanvas = document.createElement("canvas")
  sunCanvas.width = 512
  sunCanvas.height = 512
  const sCtx = sunCanvas.getContext("2d")!
  sCtx.fillStyle = rgbCss(0xcad0d2)
  sCtx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 360; i++) {
    const ang = (i / 360) * Math.PI * 2
    const sheen = 0.5 + 0.5 * Math.sin(ang * 2 + 0.6)
    const lum = Math.round(165 + sheen * 75)
    sCtx.strokeStyle = `rgb(${lum}, ${lum + 2}, ${lum + 4})`
    sCtx.lineWidth = 2.2
    sCtx.beginPath()
    sCtx.moveTo(256, 256)
    sCtx.lineTo(256 + Math.cos(ang) * 260, 256 + Math.sin(ang) * 260)
    sCtx.stroke()
  }
  const sunburstColorMap = new THREE.CanvasTexture(sunCanvas)
  sunburstColorMap.colorSpace = THREE.SRGBColorSpace
  const sunburstBump = new THREE.CanvasTexture(sunCanvas)

  // 4. Grand Feu Enamel Dial (12H top, recessed 9H small seconds)
  const dialCanvas = document.createElement("canvas")
  dialCanvas.width = 1024
  dialCanvas.height = 1024
  const dCtx = dialCanvas.getContext("2d")!
  dCtx.fillStyle = rgbCss(HOROLOGY_MATERIALS.enamelDial)
  dCtx.fillRect(0, 0, 1024, 1024)

  const cx = 512
  const cy = 512
  // Subtle enamel radial sheen
  const enamelGrad = dCtx.createRadialGradient(cx - 90, cy - 110, 40, cx, cy, 490)
  enamelGrad.addColorStop(0, rgbCss(0xfcfaf4))
  enamelGrad.addColorStop(0.85, rgbCss(0xf4f0e6))
  enamelGrad.addColorStop(1, rgbCss(0xe5dfd1))
  dCtx.fillStyle = enamelGrad
  dCtx.beginPath()
  dCtx.arc(cx, cy, 492, 0, Math.PI * 2)
  dCtx.fill()

  // Outer railroad minute track
  const ink = rgbCss(HOROLOGY_MATERIALS.enamelInk)
  dCtx.strokeStyle = ink
  dCtx.lineWidth = 3
  dCtx.beginPath()
  dCtx.arc(cx, cy, 456, 0, Math.PI * 2)
  dCtx.stroke()
  dCtx.lineWidth = 2
  dCtx.beginPath()
  dCtx.arc(cx, cy, 434, 0, Math.PI * 2)
  dCtx.stroke()

  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2 - Math.PI / 2
    const isFive = m % 5 === 0
    dCtx.lineWidth = isFive ? 4.5 : 2
    dCtx.beginPath()
    dCtx.moveTo(cx + Math.cos(a) * 434, cy + Math.sin(a) * 434)
    dCtx.lineTo(cx + Math.cos(a) * 456, cy + Math.sin(a) * 456)
    dCtx.stroke()
  }

  // Roman numerals (omitting IX where 9H subdial sits)
  const romans = [
    "XII",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "",
    "X",
    "XI",
  ]
  dCtx.fillStyle = ink
  dCtx.font = "600 52px Georgia, serif"
  dCtx.textAlign = "center"
  dCtx.textBaseline = "middle"
  for (let h = 0; h < 12; h++) {
    if (!romans[h]) continue
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2
    const rx = cx + Math.cos(a) * 372
    const ry = cy + Math.sin(a) * 372
    dCtx.fillText(romans[h], rx, ry)
  }

  // Signature dial printing
  dCtx.font = "600 26px Georgia, serif"
  dCtx.fillText("ÉTABLI", cx, cy - 150)
  dCtx.font = "400 18px system-ui, sans-serif"
  dCtx.fillStyle = rgbCss(0x4a4e4d)
  dCtx.fillText("LE LOCLE · 17 RUBIS", cx, cy - 118)
  dCtx.fillText("CAL. 6497-1", cx, cy + 215)

  // Recessed 9 o'clock small-seconds subdial
  const subX = cx - 235
  const subY = cy
  const subR = 122
  dCtx.fillStyle = rgbCss(0xede8dc)
  dCtx.beginPath()
  dCtx.arc(subX, subY, subR, 0, Math.PI * 2)
  dCtx.fill()
  dCtx.strokeStyle = rgbCss(0xcbc4b4)
  dCtx.lineWidth = 3
  dCtx.stroke()

  dCtx.strokeStyle = ink
  dCtx.lineWidth = 1.8
  dCtx.beginPath()
  dCtx.arc(subX, subY, subR - 10, 0, Math.PI * 2)
  dCtx.stroke()
  for (let s = 0; s < 60; s++) {
    const a = (s / 60) * Math.PI * 2 - Math.PI / 2
    const major = s % 10 === 0
    const len = major ? 15 : s % 5 === 0 ? 10 : 6
    dCtx.lineWidth = major ? 2.4 : 1.3
    dCtx.beginPath()
    dCtx.moveTo(subX + Math.cos(a) * (subR - 10 - len), subY + Math.sin(a) * (subR - 10 - len))
    dCtx.lineTo(subX + Math.cos(a) * (subR - 10), subY + Math.sin(a) * (subR - 10))
    dCtx.stroke()
  }
  dCtx.fillStyle = ink
  dCtx.font = "500 18px system-ui, sans-serif"
  for (const sec of [60, 20, 40]) {
    const a = (sec / 60) * Math.PI * 2 - Math.PI / 2
    dCtx.fillText(
      String(sec),
      subX + Math.cos(a) * (subR - 42),
      subY + Math.sin(a) * (subR - 42)
    )
  }

  const dialColorMap = new THREE.CanvasTexture(dialCanvas)
  dialColorMap.colorSpace = THREE.SRGBColorSpace

  return {
    cotesColorMap,
    cotesBump,
    perlageColorMap,
    perlageBump,
    sunburstColorMap,
    sunburstBump,
    dialColorMap,
    dispose() {
      cotesColorMap.dispose()
      cotesBump.dispose()
      perlageColorMap.dispose()
      perlageBump.dispose()
      sunburstColorMap.dispose()
      sunburstBump.dispose()
      dialColorMap.dispose()
    },
  }
}

export function createBenchStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color(0x1b2622)

  // Twin-tube overhead 4200K Waldmann watchmaker bench diffuser strips (crisp specular bands)
  const tubeA = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 3.6),
    new THREE.MeshBasicMaterial({ color: 0xfff8ea, side: THREE.DoubleSide })
  )
  tubeA.position.set(2, 9.5, 5.5)
  tubeA.lookAt(0, 0, 0)
  envScene.add(tubeA)

  const tubeB = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 2.8),
    new THREE.MeshBasicMaterial({ color: 0xffefd2, side: THREE.DoubleSide })
  )
  tubeB.position.set(-2, 10.5, -2.5)
  tubeB.lookAt(0, 0, 0)
  envScene.add(tubeB)

  const rimPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 7),
    new THREE.MeshBasicMaterial({ color: 0xdcecff, side: THREE.DoubleSide })
  )
  rimPanel.position.set(-10, 5, 6)
  rimPanel.lookAt(0, 0, 0)
  envScene.add(rimPanel)

  const sideFill = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 6),
    new THREE.MeshBasicMaterial({ color: 0xf7e6c4, side: THREE.DoubleSide })
  )
  sideFill.position.set(10, -4, 5)
  sideFill.lookAt(0, 0, 0)
  envScene.add(sideFill)

  const brassBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: 0x1e382f, side: THREE.DoubleSide })
  )
  brassBounce.position.set(0, -9, 0)
  brassBounce.lookAt(0, 0, 0)
  envScene.add(brassBounce)

  const rt = pmrem.fromScene(envScene, 0.025)
  pmrem.dispose()
  return rt.texture
}
