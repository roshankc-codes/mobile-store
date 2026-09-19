"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ShieldCheck, Truck, RotateCcw } from "lucide-react"
import type { Product } from "@/lib/products"
import { discountPercent } from "@/lib/currency"
import { useCart } from "@/lib/cart-context"
import { Price } from "@/components/store/price"
import { Rating } from "@/components/store/rating"
import { StockStatus } from "@/components/store/stock-status"
import { QuantityStepper } from "@/components/store/quantity-stepper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

const guarantees = [
  { icon: ShieldCheck, label: "Official warranty" },
  { icon: Truck, label: "Nationwide delivery" },
  { icon: RotateCcw, label: "7-day returns" },
]

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const off = discountPercent(product.price, product.originalPrice)
  const out = product.stock <= 0

  function handleAdd() {
    addItem(product, quantity)
    toast.success("Added to cart", {
      description: `${product.name}${quantity > 1 ? ` × ${quantity}` : ""}`,
      icon: <Check className="size-4" />,
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-contain p-8"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off && <Badge variant="destructive">-{off}%</Badge>}
          {out && <Badge variant="secondary">Sold out</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>
          <h1 className="text-pretty text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>
          <Rating rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <Price price={product.price} originalPrice={product.originalPrice} size="lg" />

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{product.description}</p>

        <ul className="grid gap-2 sm:grid-cols-2">
          {product.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {h}
            </li>
          ))}
        </ul>

        <Separator />

        <div className="flex flex-col gap-3">
          <StockStatus stock={product.stock} />
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, product.stock)} />
            <Button size="lg" className="h-11 flex-1 sm:flex-none sm:px-8" disabled={out} onClick={handleAdd}>
              {out ? "Out of stock" : "Add to cart"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-4">
          {guarantees.map((g) => (
            <div key={g.label} className="flex flex-col items-center gap-1.5 text-center">
              <g.icon className="size-5 text-primary" />
              <span className="text-xs text-muted-foreground">{g.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Specifications</h2>
          <Table>
            <TableBody>
              {product.specs.map((spec) => (
                <TableRow key={spec.label}>
                  <TableCell className="w-2/5 text-muted-foreground">{spec.label}</TableCell>
                  <TableCell className="font-medium text-foreground">{spec.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
