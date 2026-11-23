// Precision 2D Horological Technical Canvas Fallback
// Renders the live 18,000 vph Unitas 6497-1 movement, breathing Nivarox spiral,
// club-tooth escape wheel, bridges, rubies, dial side, and clickable part hit-regions
// whenever WebGL2/WebGPU is unavailable (e.g., software-disabled headless environments).

import { CALIBER_6497_PARTS } from "./caliber6497"
import { HOROLOGY_MATERIALS, rgbCss } from "./material-palette"
import type { HorologySnapshot } from "./physics"

export interface FallbackHitRegion {
  partId: string
  cx: number
  cy: number
  r: number
}

export function render2dMacroFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  snapshot: HorologySnapshot,
  options: {
    installedParts: ReadonlySet<string>
    selectedPartId: string | null
    hoveredPartId: string | null
    guidedPartId: string | null
    explodeAmount: number
    side: "movement" | "dial"
    zoom: number
  }
): FallbackHitRegion[] {
  const hits: FallbackHitRegion[] = []
  ctx.save()
  ctx.clearRect(0, 0, width, height)

  // Bergeon green bench mat background with subtle vignette
  const bg = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    24,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72
  )
  bg.addColorStop(0, rgbCss(HOROLOGY_MATERIALS.bergeonMatLight))
  bg.addColorStop(1, rgbCss(HOROLOGY_MATERIALS.bergeonMatDark))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const cx = width * 0.5
  const cy = height * 0.5
  const baseScale = Math.min(width, height) * 0.042 * options.zoom

  const toScreen = (mx: number, my: number, expZ = 0): [number, number] => {
    const flipX = options.side === "dial" ? -mx : mx
    const explodeShiftY = -expZ * options.explodeAmount * 8
    return [cx + flipX * baseScale, cy - my * baseScale + explodeShiftY]
  }

  // Movement holder outer bezel
  ctx.strokeStyle = rgbCss(0x4b5853)
  ctx.lineWidth = Math.max(4, baseScale * 0.48)
  ctx.beginPath()
  ctx.arc(cx, cy, 9.75 * baseScale, 0, Math.PI * 2)
  ctx.stroke()

  if (options.side === "dial" && options.installedParts.has("dial_plate")) {
    // Grand Feu Enamel Dial view
    const [dx, dy] = toScreen(0, 0, -1.2)
    const dr = 9.2 * baseScale
    ctx.fillStyle = rgbCss(HOROLOGY_MATERIALS.enamelDial)
    ctx.beginPath()
    ctx.arc(dx, dy, dr, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = rgbCss(HOROLOGY_MATERIALS.enamelInk)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(dx, dy, dr * 0.92, 0, Math.PI * 2)
    ctx.stroke()

    // 9H small seconds subdial
    const [sx, sy] = [dx - 4.4 * baseScale, dy]
    ctx.strokeStyle = rgbCss(HOROLOGY_MATERIALS.enamelInk, 0.7)
    ctx.beginPath()
    ctx.arc(sx, sy, 2.2 * baseScale, 0, Math.PI * 2)
    ctx.stroke()

    hits.push({ partId: "dial_plate", cx: dx, cy: dy, r: dr })

    if (options.installedParts.has("hands_set")) {
      ctx.strokeStyle = rgbCss(HOROLOGY_MATERIALS.bluedHandSteel)
      ctx.lineCap = "round"
      ctx.lineWidth = Math.max(3, baseScale * 0.24)
      ctx.beginPath()
      ctx.moveTo(dx, dy)
      ctx.lineTo(dx + Math.cos(-0.9) * dr * 0.5, dy + Math.sin(-0.9) * dr * 0.5)
      ctx.stroke()

      ctx.lineWidth = Math.max(2, baseScale * 0.16)
      const minAng = -Math.PI * 0.5 + snapshot.centerWheelAngleRad
      ctx.beginPath()
      ctx.moveTo(dx, dy)
      ctx.lineTo(dx + Math.cos(minAng) * dr * 0.78, dy + Math.sin(minAng) * dr * 0.78)
      ctx.stroke()

      const secAng = -Math.PI * 0.5 + snapshot.fourthWheelAngleRad
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(
        sx + Math.cos(secAng) * 1.85 * baseScale,
        sy + Math.sin(secAng) * 1.85 * baseScale
      )
      ctx.stroke()
      hits.push({ partId: "hands_set", cx: dx, cy: dy, r: dr * 0.45 })
    }
    ctx.restore()
    return hits
  }

  // Movement side technical macro view
  if (options.installedParts.has("mainplate")) {
    const [px, py] = toScreen(0, 0, 0)
    const pr = 9.15 * baseScale
    ctx.fillStyle = rgbCss(HOROLOGY_MATERIALS.rhodiumPlate)
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = rgbCss(0x8c9693)
    ctx.lineWidth = 2
    ctx.stroke()
    hits.push({ partId: "mainplate", cx: px, cy: py, r: pr })
  }

  const drawWheel = (
    partId: string,
    mx: number,
    my: number,
    rad: number,
    angle: number,
    colorHex: number,
    expZ: number
  ) => {
    const isInstalled = options.installedParts.has(partId)
    const isGuided = options.guidedPartId === partId
    if (!isInstalled && !isGuided) return
    const [wx, wy] = toScreen(mx, my, expZ)
    const wr = rad * baseScale
    ctx.save()
    ctx.globalAlpha = isInstalled ? 1 : 0.42
    ctx.translate(wx, wy)
    ctx.rotate(angle)
    ctx.strokeStyle = rgbCss(colorHex)
    ctx.lineWidth = Math.max(2.5, baseScale * 0.22)
    ctx.beginPath()
    ctx.arc(0, 0, wr, 0, Math.PI * 2)
    ctx.stroke()
    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * Math.PI
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * -wr, Math.sin(a) * -wr)
      ctx.lineTo(Math.cos(a) * wr, Math.sin(a) * wr)
      ctx.stroke()
    }
    ctx.restore()
    hits.push({ partId, cx: wx, cy: wy, r: wr })
  }

  drawWheel("center_wheel", 0, 0, 2.6, snapshot.centerWheelAngleRad, HOROLOGY_MATERIALS.wheelBrass, 1.1)
  drawWheel("mainspring_barrel", -2.9, 2.7, 3.4, -snapshot.barrelAngleRad, HOROLOGY_MATERIALS.wheelBrass, 1.5)
  drawWheel("third_wheel", -1.5, -2.2, 2.05, -snapshot.thirdWheelAngleRad, HOROLOGY_MATERIALS.wheelBrass, 1.6)
  drawWheel("fourth_wheel", -4.7, 0, 2.1, snapshot.fourthWheelAngleRad, HOROLOGY_MATERIALS.wheelBrass, 1.9)
  drawWheel("escape_wheel", 1.4, -3.1, 1.5, -snapshot.escapeWheelAngleRad, HOROLOGY_MATERIALS.temperedSteel, 2.2)

  // Barrel bridge & Train bridge plates
  const drawBridge = (
    partId: string,
    mx: number,
    my: number,
    rx: number,
    ry: number,
    expZ: number,
    rubies: [number, number][]
  ) => {
    const isInstalled = options.installedParts.has(partId)
    const isGuided = options.guidedPartId === partId
    if (!isInstalled && !isGuided) return
    const [bx, by] = toScreen(mx, my, expZ)
    ctx.save()
    ctx.globalAlpha = isInstalled ? 0.92 : 0.38
    ctx.fillStyle = rgbCss(0xcad0ce)
    ctx.strokeStyle =
      options.selectedPartId === partId || options.hoveredPartId === partId || isGuided
        ? rgbCss(HOROLOGY_MATERIALS.highlightGold)
        : rgbCss(0x7c8784)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(bx, by, rx * baseScale, ry * baseScale, -0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    for (const [jx, jy] of rubies) {
      const [sx, sy] = toScreen(jx, jy, expZ)
      ctx.fillStyle = rgbCss(HOROLOGY_MATERIALS.syntheticRuby)
      ctx.beginPath()
      ctx.arc(sx, sy, Math.max(3, baseScale * 0.34), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    hits.push({ partId, cx: bx, cy: by, r: Math.max(rx, ry) * baseScale * 0.85 })
  }

  drawBridge("barrel_bridge", -2.1, 3.3, 4.8, 3.4, 2.6, [[0, 0]])
  drawBridge("train_bridge", -2.2, -2.5, 4.3, 2.7, 2.9, [
    [-1.5, -2.2],
    [-4.7, 0],
    [1.4, -3.1],
  ])
  drawBridge("pallet_cock_fork", 2.9, -1.5, 1.4, 1.2, 3.3, [[2.9, -1.5]])

  // Balance wheel + breathing spiral at [4.7, -2.8]
  if (
    options.installedParts.has("balance_assembly") ||
    options.guidedPartId === "balance_assembly"
  ) {
    const [bx, by] = toScreen(4.7, -2.8, 4.1)
    const br = 3.05 * baseScale
    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(snapshot.balanceAngleRad)
    ctx.strokeStyle = rgbCss(HOROLOGY_MATERIALS.glucydurBrass)
    ctx.lineWidth = Math.max(3.5, baseScale * 0.32)
    ctx.beginPath()
    ctx.arc(0, 0, br, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-br, 0)
    ctx.lineTo(br, 0)
    ctx.stroke()
    ctx.restore()

    // Spiral hairspring
    ctx.strokeStyle = rgbCss(HOROLOGY_MATERIALS.nivaroxSpring)
    ctx.lineWidth = 1.2
    ctx.beginPath()
    for (let i = 0; i < 120; i++) {
      const u = i / 119
      const a = u * 8 * Math.PI * 2 + snapshot.balanceAngleRad * (1 - u)
      const r = (0.35 + u * 1.75) * baseScale
      const sx = bx + Math.cos(a) * r
      const sy = by + Math.sin(a) * r
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.stroke()

    ctx.fillStyle = rgbCss(HOROLOGY_MATERIALS.syntheticRuby)
    ctx.beginPath()
    ctx.arc(bx, by, Math.max(4, baseScale * 0.42), 0, Math.PI * 2)
    ctx.fill()
    hits.push({ partId: "balance_assembly", cx: bx, cy: by, r: br })
  }

  // Winding stem & crown at 3H
  if (options.installedParts.has("stem_crown")) {
    const [sx, sy] = toScreen(10.8, 0, 2.0)
    ctx.fillStyle = rgbCss(HOROLOGY_MATERIALS.glucydurBrass)
    ctx.beginPath()
    ctx.ellipse(sx, sy, 0.85 * baseScale, 1.3 * baseScale, 0, 0, Math.PI * 2)
    ctx.fill()
    hits.push({ partId: "stem_crown", cx: sx, cy: sy, r: 1.4 * baseScale })
  }

  // Highlight ring on selected/guided part
  const focusId = options.guidedPartId || options.selectedPartId
  if (focusId) {
    const targetSpec = CALIBER_6497_PARTS.find((p) => p.id === focusId)
    if (targetSpec) {
      const [fx, fy] = toScreen(
        targetSpec.anchor[0] * 0.68,
        targetSpec.anchor[1] * 0.68,
        targetSpec.explodeZ
      )
      ctx.strokeStyle = rgbCss(HOROLOGY_MATERIALS.highlightGold)
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(fx, fy, 1.9 * baseScale, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  ctx.restore()
  return hits
}
