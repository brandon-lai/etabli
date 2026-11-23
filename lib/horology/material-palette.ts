// Physical metal, jewel, enamel, and bench-mat color constants for Three.js PBR
// and 2D macro canvas fallback. Kept in lib/horology using numeric 24-bit RGB
// values so UI stylesheets and components remain 100% token-driven.

export const HOROLOGY_MATERIALS = {
  bergeonMatDark: 0x15241f,
  bergeonMatLight: 0x1d332c,
  rhodiumPlate: 0xd4d8d6,
  rhodiumRecess: 0xb8bdbc,
  glucydurBrass: 0xd9ae52,
  wheelBrass: 0xcfa349,
  incablocLyreBrass: 0xe2b95b,
  temperedSteel: 0xc5cacd,
  bluedSteelScrew: 0x245ec7,
  bluedHandSteel: 0x1d4ea8,
  nivaroxSpring: 0x8ea4bd,
  syntheticRuby: 0xb81d3a,
  rubyDeep: 0x7c1025,
  oilMeniscusClean: 0x6ec6d9,
  oilMeniscusFlooded: 0xd99b26,
  enamelDial: 0xf7f4ec,
  enamelInk: 0x191c1b,
  caseSteel: 0xd8dcde,
  highlightGold: 0xe6c275,
  warningAmber: 0xd9822b,
} as const

export function rgbCss(rgb24: number, alpha = 1): string {
  const r = (rgb24 >> 16) & 255
  const g = (rgb24 >> 8) & 255
  const b = rgb24 & 255
  if (alpha >= 1) {
    return ["rgb(", r, ",", g, ",", b, ")"].join("")
  }
  return ["rgba(", r, ",", g, ",", b, ",", alpha, ")"].join("")
}

export function stampShareCardCanvas(
  srcCanvas: HTMLCanvasElement,
  meta: {
    title: string
    rateText: string
    amplitudeText: string
    beatErrorText: string
    positionCode: string
  }
): string | null {
  if (srcCanvas.width === 0 || srcCanvas.height === 0) return null
  const out = document.createElement("canvas")
  out.width = 1400
  out.height = 900
  const ctx = out.getContext("2d")
  if (!ctx) return null

  ctx.drawImage(srcCanvas, 0, 0, out.width, out.height)
  ctx.fillStyle = rgbCss(0x0a110f, 0.88)
  ctx.fillRect(0, out.height - 118, out.width, 118)
  ctx.fillStyle = rgbCss(0xf2efe6)
  ctx.font = "600 30px system-ui, -apple-system, sans-serif"
  ctx.fillText(`Établi · ${meta.title}`, 44, out.height - 66)
  ctx.font = "500 22px ui-monospace, SFMono-Regular, monospace"
  ctx.fillStyle = rgbCss(HOROLOGY_MATERIALS.highlightGold)
  ctx.fillText(
    `ETA 6497-1  |  ${meta.positionCode}  |  Rate ${meta.rateText}  |  Amp ${meta.amplitudeText}  |  Beat ${meta.beatErrorText}`,
    44,
    out.height - 28
  )
  return out.toDataURL("image/png")
}
