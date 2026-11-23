import type { Metadata, Viewport } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerRegistrar } from "@/components/sw-registrar"
import { OG_TOKENS } from "@/lib/og-tokens"

const resolvedAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: new URL(resolvedAppUrl),
  title: {
    default: "Établi — Mechanical Watchmaking Apprenticeship",
    template: "%s · Établi",
  },
  description:
    "Strip, clean, oil, reassemble, and regulate a real 17-jewel Unitas 6497-1 pocket-watch movement one-on-one with a master watchmaker in your browser.",
  openGraph: {
    title: "Établi — Mechanical Watchmaking Apprenticeship",
    description:
      "One movement, one master, real tolerances. Service and regulate the Unitas 6497-1 under a macro loupe.",
    type: "website",
    siteName: "Établi",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Établi horological bench showing the Unitas 6497-1 balance wheel, synthetic ruby jewel, and live 18,000 vph timegrapher trace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Établi — Mechanical Watchmaking Apprenticeship",
    description:
      "Service and regulate a real Unitas 6497-1 mechanical movement under a macro loupe.",
    images: ["/opengraph-image"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: OG_TOKENS.daylightPaper },
    { media: "(prefers-color-scheme: dark)", color: OG_TOKENS.benchCanvas },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body>
        <ThemeProvider>
          <TooltipProvider delay={650}>
            {children}
            <Toaster position="bottom-right" />
            <ServiceWorkerRegistrar />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
