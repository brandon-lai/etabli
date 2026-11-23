import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <Search className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Lost on the workshop floor
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Even a setting lever spring launched across the room turns up with a
          magnet and a low lamp, but there is no caliber sheet or bench view at
          this address.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/" />} size="lg">
            Return to the bench
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/course" />}
          >
            Open Course 1 syllabus
          </Button>
        </div>
      </div>
    </main>
  )
}
