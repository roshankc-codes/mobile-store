import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/products"
import { discountPercent } from "@/lib/currency"
import { Price } from "@/components/store/price"
import { Rating } from "@/components/store/rating"
import { StockStatus } from "@/components/store/stock-status"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { Badge } from "@/components/ui/badge"

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.price, product.originalPrice)
  const out = product.stock <= 0

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/20">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off && <Badge variant="destructive">-{off}%</Badge>}
          {out && <Badge variant="secondary">Sold out</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline"
          >
            {product.name}
          </Link>
        </div>
        <Rating rating={product.rating} reviewCount={product.reviewCount} />
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Price price={product.price} originalPrice={product.originalPrice} size="sm" />
          <StockStatus stock={product.stock} />
          <AddToCartButton product={product} size="sm" fullWidth iconOnly={false} label="Add" />
        </div>
      </div>
    </div>
  )
}
