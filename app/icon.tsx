import { ImageResponse } from "next/og"
import { OG_TOKENS } from "@/lib/og-tokens"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
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
          borderRadius: 14,
          border: `2px solid ${OG_TOKENS.brass}`,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: `4px solid ${OG_TOKENS.brassBright}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
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
