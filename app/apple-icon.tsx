import { ImageResponse } from "next/og"
import { OG_TOKENS } from "@/lib/og-tokens"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: OG_TOKENS.benchMat,
          borderRadius: 40,
          border: `5px solid ${OG_TOKENS.brass}`,
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: 999,
            border: `10px solid ${OG_TOKENS.brassBright}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              backgroundColor: OG_TOKENS.ruby,
            }}
          />
        </div>
      </div>
    ),
    size
  )
}
