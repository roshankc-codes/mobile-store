"use client"

import { ShoppingBag, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/lib/products"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
  className?: string
  fullWidth?: boolean
  label?: string
  iconOnly?: boolean
}

export function AddToCartButton({
  product,
  quantity = 1,
  variant = "default",
  size = "default",
  className,
  fullWidth,
  label = "Add to cart",
  iconOnly,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const out = product.stock <= 0

  function handleClick() {
    addItem(product, quantity)
    toast.success("Added to cart", {
      description: `${product.name}${quantity > 1 ? ` × ${quantity}` : ""}`,
      icon: <Check className="size-4" />,
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={out}
      onClick={handleClick}
      className={cn(fullWidth && "w-full", className)}
      aria-label={iconOnly ? `Add ${product.name} to cart` : undefined}
    >
      <ShoppingBag data-icon="inline-start" />
      {!iconOnly && (out ? "Out of stock" : label)}
    </Button>
  )
}
