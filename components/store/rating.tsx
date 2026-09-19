import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
  rating: number
  reviewCount?: number
  className?: string
}

export function Rating({ rating, reviewCount, className }: RatingProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i < Math.round(rating) ? "fill-foreground text-foreground" : "fill-muted text-muted",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && <span className="text-xs text-muted-foreground">({reviewCount})</span>}
      <span className="sr-only">
        Rated {rating.toFixed(1)} out of 5{reviewCount !== undefined ? ` from ${reviewCount} reviews` : ""}
      </span>
    </div>
  )
}
