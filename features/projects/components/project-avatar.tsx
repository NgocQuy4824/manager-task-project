"use client"

import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"

const SIZES: Record<Size, string> = {
  sm: "h-8 w-8 rounded-lg text-xs",
  md: "h-11 w-11 rounded-xl text-base",
  lg: "h-14 w-14 rounded-2xl text-xl",
}

function hueFromName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

function initialOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/)
  const last = parts[parts.length - 1] ?? trimmed
  return last.charAt(0).toUpperCase()
}

export function ProjectAvatar({
  name,
  size = "md",
  className,
}: {
  name: string
  size?: Size
  className?: string
}) {
  const hue = hueFromName(name || "project")
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center border font-semibold",
        SIZES[size],
        className,
      )}
      style={{
        background: `hsl(${hue} 70% 93%)`,
        borderColor: `hsl(${hue} 55% 84%)`,
        color: `hsl(${hue} 68% 33%)`,
      }}
    >
      {initialOf(name)}
    </span>
  )
}
