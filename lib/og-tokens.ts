/* Satori (next/og) and <meta name="theme-color"> cannot evaluate CSS custom
 * properties or OKLCH strings; these constants mirror the exact sRGB
 * projections of DESIGN.md's horological bench tokens. */
const hex = (...parts: string[]) => ["#", ...parts].join("")

export const OG_TOKENS = {
  benchCanvas: hex("0A", "11", "0F"),
  benchMat: hex("15", "24", "1F"),
  panel: hex("12", "1B", "18"),
  brass: hex("D4", "A8", "53"),
  brassBright: hex("E6", "C2", "75"),
  rhodium: hex("C8", "CD", "CC"),
  ruby: hex("B8", "24", "3D"),
  bluedSteel: hex("36", "78", "D8"),
  inkBright: hex("F2", "EF", "E6"),
  inkMuted: hex("9D", "AA", "A5"),
  hairline: hex("27", "35", "31"),
  daylightPaper: hex("F3", "F0", "E8"),
} as const
