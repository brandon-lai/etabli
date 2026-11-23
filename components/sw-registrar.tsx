"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }
    if (window.location.hostname === "localhost" && process.env.NODE_ENV !== "production") {
      return
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline cache is progressive enhancement; never block bench startup.
    })
  }, [])

  return null
}
