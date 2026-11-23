import type { Metadata } from "next"
import { BenchWorkspace } from "@/components/bench/bench-workspace"

export const metadata: Metadata = {
  title: "Watchmaker's Bench",
  description:
    "Service, clean, oil, and regulate the 17-jewel Unitas / ETA 6497-1 pocket-watch movement one-on-one with Master Henri.",
}

export default async function BenchPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>
}) {
  const params = await searchParams
  return <BenchWorkspace initialLessonId={params.lesson} />
}
