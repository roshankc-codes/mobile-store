import { cn } from "@/lib/utils"

interface StockStatusProps {
  stock: number
  className?: string
  lowThreshold?: number
}

export function StockStatus({ stock, className, lowThreshold = 10 }: StockStatusProps) {
  const out = stock <= 0
  const low = !out && stock <= lowThreshold
  const dot = out ? "bg-destructive" : low ? "bg-amber-500" : "bg-success"
  const label = out ? "Out of stock" : low ? `Only ${stock} left` : "In stock"
  const text = out ? "text-destructive" : "text-muted-foreground"
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", text, className)}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {label}
    </span>
  )
}
