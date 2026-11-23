import type { Metadata } from "next"
import { ExploreView } from "@/components/explore/explore-view"

export const metadata: Metadata = {
  title: "Explore Calibre 6497-1",
  description:
    "Interactive 3D exploded anatomy, 0.03x Swiss lever escapement slow-motion study, and live physics fault lab for the 17-jewel Unitas / ETA 6497-1.",
}

export default function ExplorePage() {
  return <ExploreView />
}
