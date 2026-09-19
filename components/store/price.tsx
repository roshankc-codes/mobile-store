import { cn } from "@/lib/utils"
import { formatPrice, discountPercent } from "@/lib/currency"

interface PriceProps {
  price: number
  originalPrice?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: { price: "text-sm", original: "text-xs" },
  md: { price: "text-base", original: "text-sm" },
  lg: { price: "text-2xl", original: "text-base" },
}

export function Price({ price, originalPrice, size = "md", className }: PriceProps) {
  const off = discountPercent(price, originalPrice)
  const s = sizes[size]
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-mono font-semibold tracking-tight text-foreground", s.price)}>
        {formatPrice(price)}
      </span>
      {off && (
        <>
          <span className={cn("font-mono text-muted-foreground line-through", s.original)}>
            {formatPrice(originalPrice!)}
          </span>
          <span className={cn("font-medium text-success", s.original)}>{off}% off</span>
        </>
      )}
    </div>
  )
}
