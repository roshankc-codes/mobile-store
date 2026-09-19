"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, CreditCard, Truck, Banknote } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"
import { shippingFor } from "@/lib/shipping"
import { StoreShell } from "@/components/store/store-shell"
import { OrderSummary } from "@/components/store/order-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const paymentOptions = [
  { value: "cod", label: "Cash on delivery", description: "Pay when your order arrives", icon: Banknote },
  { value: "card", label: "Card / eSewa / Khalti", description: "Pay securely online", icon: CreditCard },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { lines, subtotal, clear } = useCart()
  const [payment, setPayment] = useState("cod")
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = `HM-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderId(id)
    setPlaced(true)
    clear()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (placed) {
    return (
      <StoreShell>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-9" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Order confirmed</h1>
            <p className="text-pretty text-sm text-muted-foreground">
              Thanks for your order. A confirmation has been sent to your email. Your order number is{" "}
              <span className="font-semibold text-foreground">{orderId}</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <Button render={<Link href="/products">Continue shopping</Link>} />
            <Button variant="outline" render={<Link href="/account">View orders</Link>} />
          </div>
        </div>
      </StoreShell>
    )
  }

  if (lines.length === 0) {
    return (
      <StoreShell>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground">Add items to your cart before checking out.</p>
          <Button render={<Link href="/products">Browse products</Link>} />
        </div>
      </StoreShell>
    )
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input id="fullName" name="fullName" autoComplete="name" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" autoComplete="email" required />
                    <FieldDescription>Order updates will be sent here.</FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping address</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="address">Street address</FieldLabel>
                    <Input id="address" name="address" autoComplete="street-address" required />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="city">City</FieldLabel>
                      <Input id="city" name="city" autoComplete="address-level2" required defaultValue="Kathmandu" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="province">Province</FieldLabel>
                      <Input id="province" name="province" required defaultValue="Bagmati" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="postal">Postal code</FieldLabel>
                      <Input id="postal" name="postal" autoComplete="postal-code" />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={payment} onValueChange={setPayment} className="gap-3">
                  {paymentOptions.map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`pay-${opt.value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={`pay-${opt.value}`} value={opt.value} />
                      <opt.icon className="size-5 text-muted-foreground" />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-3">
                  {lines.map((line) => (
                    <li key={line.product.id} className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted/40">
                        <Image
                          src={line.product.image || "/placeholder.svg"}
                          alt={line.product.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                        <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                          {line.quantity}
                        </span>
                      </div>
                      <span className="line-clamp-2 flex-1 text-xs text-foreground">{line.product.name}</span>
                      <span className="text-xs font-medium tabular-nums text-foreground">
                        {formatPrice(line.product.price * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Separator />
                <OrderSummary subtotal={subtotal} />
                <Button type="submit" size="lg" className="w-full">
                  <Truck data-icon="inline-start" />
                  Place order · {formatPrice(subtotal + shippingFor(subtotal))}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </StoreShell>
  )
}
