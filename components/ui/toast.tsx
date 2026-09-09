"use client"

import { create } from "zustand"
import { CheckCircle2, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "error" | "info"

export type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastState = {
  toasts: ToastItem[]
  push: (message: string, variant: ToastVariant) => void
  dismiss: (id: string) => void
}

let counter = 0
function nextId() {
  counter += 1
  return `toast-${Date.now()}-${counter}`
}

const AUTO_DISMISS_MS = 3500

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant) => {
    const id = nextId()
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, AUTO_DISMISS_MS)
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

function extractMessage(e: unknown, fallback: string): string {
  const err = e as { error?: string; message?: string }
  const msg = err?.error ?? err?.message ?? fallback
  return typeof msg === "string" ? msg : fallback
}

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
  info: (message: string) => useToastStore.getState().push(message, "info"),
  fromError: (e: unknown, fallback: string) => useToastStore.getState().push(extractMessage(e, fallback), "error"),
}

const VARIANT_STYLE: Record<ToastVariant, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "border-emerald-200 dark:border-emerald-800", iconColor: "text-emerald-600 dark:text-emerald-400" },
  error: { icon: XCircle, ring: "border-destructive/30", iconColor: "text-destructive" },
  info: { icon: Info, ring: "border-blue-200 dark:border-blue-800", iconColor: "text-blue-600 dark:text-blue-400" },
}

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const { icon: Icon, ring, iconColor } = VARIANT_STYLE[item.variant]
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-lg border bg-card px-3.5 py-3 shadow-soft-lg",
        ring,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor)} />
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug break-words text-foreground">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        className="-mr-1 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Đóng"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => <ToastCard key={t.id} item={t} />)}
    </div>
  )
}
