import { useState } from "react"

interface Toast {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description, variant = "default" }: Toast) => {
    // Einfache Implementierung mit alert für jetzt
    if (variant === "destructive") {
      alert(`Fehler: ${title}\n${description || ""}`)
    } else {
      alert(`${title}\n${description || ""}`)
    }
  }

  return { toast, toasts }
}
