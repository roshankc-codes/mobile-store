"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: "sm" | "default"
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "default",
  className,
}: QuantityStepperProps) {
  const btn =
    "flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
  const dims = size === "sm" ? "size-7" : "size-9"

  return (
    <div className={cn("inline-flex items-center rounded-md border border-border bg-background", className)}>
      <button
        type="button"
        className={cn(btn, dims)}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
      <span
        className={cn(
          "min-w-8 text-center text-sm font-medium tabular-nums text-foreground",
          size === "sm" && "min-w-7",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(btn, dims)}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
    </div>
  )
}
