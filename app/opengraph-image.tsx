import { ImageResponse } from "next/og"
import { OG_TOKENS } from "@/lib/og-tokens"

export const alt =
  "Établi horological bench showing the Unitas 6497-1 balance wheel, synthetic ruby jewel, and live 18,000 vph timegrapher trace"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "64px 76px",
          backgroundColor: OG_TOKENS.benchCanvas,
          color: OG_TOKENS.inkBright,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 620,
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              color: OG_TOKENS.brassBright,
            }}
          >
            <span>Établi</span>
            <span style={{ color: OG_TOKENS.inkMuted }}>Caliber ETA / Unitas 6497-1</span>
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              color: OG_TOKENS.inkBright,
            }}
          >
            Strip, oil, and regulate a real mechanical watch.
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.45,
              color: OG_TOKENS.inkMuted,
            }}
          >
            One-on-one apprenticeship at the bench. 17 synthetic rubies, 18,000 vph, 44° lift angle, live acoustic timegrapher.
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 12,
              padding: "16px 22px",
              borderRadius: 14,
              backgroundColor: OG_TOKENS.panel,
              border: `1px solid ${OG_TOKENS.hairline}`,
              fontFamily: "monospace",
              fontSize: 20,
            }}
          >
            <span style={{ color: OG_TOKENS.brassBright }}>+1.4 s/d</span>
            <span style={{ color: OG_TOKENS.inkBright }}>296° amp</span>
            <span style={{ color: OG_TOKENS.bluedSteel }}>0.2 ms beat</span>
          </div>
        </div>

        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 999,
            backgroundColor: OG_TOKENS.benchMat,
            border: `3px solid ${OG_TOKENS.hairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 288,
              height: 288,
              borderRadius: 999,
              border: `16px solid ${OG_TOKENS.brass}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 176,
                height: 176,
                borderRadius: 999,
                border: `4px solid ${OG_TOKENS.rhodium}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: OG_TOKENS.ruby,
                  border: `6px solid ${OG_TOKENS.brassBright}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
