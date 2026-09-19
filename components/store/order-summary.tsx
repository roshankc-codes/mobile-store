import { formatPrice } from "@/lib/currency"
import { shippingFor } from "@/lib/shipping"
import { Separator } from "@/components/ui/separator"

export function OrderSummary({ subtotal }: { subtotal: number }) {
  const shipping = shippingFor(subtotal)
  const total = subtotal + shipping

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium tabular-nums text-foreground">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Shipping</span>
        <span className="font-medium tabular-nums text-foreground">
          {shipping === 0 ? "Free" : formatPrice(shipping)}
        </span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-base">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-semibold tabular-nums text-foreground">{formatPrice(total)}</span>
      </div>
      <p className="text-xs text-muted-foreground">VAT included where applicable.</p>
    </div>
  )
}
