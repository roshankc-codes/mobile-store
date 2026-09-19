"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, Trash2, ArrowRight } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"
import { amountToFreeShipping } from "@/lib/shipping"
import { StoreShell } from "@/components/store/store-shell"
import { QuantityStepper } from "@/components/store/quantity-stepper"
import { OrderSummary } from "@/components/store/order-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export default function CartPage() {
  const { lines, subtotal, hydrated, setQuantity, removeItem } = useCart()

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Your cart</h1>

        {!hydrated ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : lines.length === 0 ? (
          <Empty className="rounded-lg border border-dashed border-border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>Your cart is empty</EmptyTitle>
              <EmptyDescription>Browse our latest phones and accessories to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link href="/products">Continue shopping</Link>} />
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {amountToFreeShipping(subtotal) > 0 && (
                <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Add{" "}
                  <span className="font-semibold text-foreground">{formatPrice(amountToFreeShipping(subtotal))}</span>{" "}
                  more to unlock free shipping.
                </p>
              )}

              <ul className="flex flex-col gap-4">
                {lines.map((line) => (
                  <li
                    key={line.product.id}
                    className="flex gap-4 rounded-lg border border-border bg-card p-3 sm:p-4"
                  >
                    <Link
                      href={`/products/${line.product.slug}`}
                      className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted/40 sm:size-24"
                    >
                      <Image
                        src={line.product.image || "/placeholder.svg"}
                        alt={line.product.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {line.product.brand}
                          </span>
                          <Link
                            href={`/products/${line.product.slug}`}
                            className="text-sm font-medium leading-snug text-foreground hover:underline"
                          >
                            {line.product.name}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.product.id)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Remove ${line.product.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(q) => setQuantity(line.product.id, q)}
                          max={Math.max(1, line.product.stock)}
                          size="sm"
                        />
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatPrice(line.product.price * line.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:sticky lg:top-20 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderSummary subtotal={subtotal} />
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button size="lg" className="w-full" render={<Link href="/checkout" />}>
                    Checkout
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full" render={<Link href="/products" />}>
                    Continue shopping
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </StoreShell>
  )
}
