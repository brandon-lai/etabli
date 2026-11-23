import { existsSync } from "node:fs"
import { registerHooks } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT_DIR = process.cwd()

function tryResolveFile(candidatePath) {
  for (const ext of ["", ".ts", ".tsx", ".js", ".mjs"]) {
    const full = candidatePath + ext
    if (existsSync(full)) return pathToFileURL(full).href
  }
  return null
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") {
      return nextResolve("next/server.js", context)
    }
    if (specifier.startsWith("@/")) {
      const target = path.join(ROOT_DIR, specifier.slice(2))
      const found = tryResolveFile(target)
      if (found) return nextResolve(found, context)
    }
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:") &&
      !context.parentURL.includes("/node_modules/")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL))
      const target = path.resolve(parentDir, specifier)
      const found = tryResolveFile(target)
      if (found) return nextResolve(found, context)
    }
    return nextResolve(specifier, context)
  },
})
