import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App"
import "@/index.css"

const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
    return
  }
  originalWarn(...args)
}

const root = document.getElementById("root")

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
