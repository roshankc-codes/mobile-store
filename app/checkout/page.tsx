"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  Truck,
  Banknote,
  QrCode,
  AlertCircle,
  Upload,
  FileText,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"
import { shippingFor } from "@/lib/shipping"
import { createClient } from "@/lib/supabase/client"
import { shopPaymentConfig } from "@/lib/payment-config"
import { StoreShell } from "@/components/store/store-shell"
import { OrderSummary } from "@/components/store/order-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

const paymentOptions = [
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay with cash when your parcel is delivered to your doorstep",
    icon: Banknote,
  },
  {
    value: "manual_qr",
    label: "Manual QR / Mobile Banking",
    description: "Scan store QR via Fonepay, eSewa or Mobile Banking & upload receipt",
    icon: QrCode,
  },
]

interface OrderResult {
  orderId: string
  orderNumber?: string
  paymentMethod: string
  paymentId?: string
  amount?: number
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart()
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Form fields
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [province, setProvince] = useState("Bagmati")
  const [district, setDistrict] = useState("Kathmandu")
  const [municipality, setMunicipality] = useState("Kathmandu Metropolitan City")
  const [area, setArea] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [payment, setPayment] = useState("cod")

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  // Manual QR Proof Upload states
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [proofError, setProofError] = useState<string | null>(null)
  const [proofSuccess, setProofSuccess] = useState(false)

  // Track authenticated user session
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user?.email && !email) {
        setEmail(data.user.email)
      }
      setAuthChecked(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.email && !email) {
        setEmail(session.user.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    // Validation for Manual QR vs Authentication
    if (payment === "manual_qr" && !user) {
      setErrorMessage(
        "Manual QR payment requires payment proof upload. Please sign in or register your account, or select Cash on Delivery.",
      )
      return
    }

    if (lines.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before placing an order.")
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      // Build checkout RPC payload matching public.checkout(JSONB) specification
      const payload = {
        customer_name: fullName.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || undefined,
        province: province.trim(),
        district: district.trim(),
        municipality: municipality.trim(),
        address: address.trim(),
        area: area.trim() || undefined,
        delivery_notes: deliveryNotes.trim() || undefined,
        payment_method: payment,
        items: lines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      }

      const { data, error } = await supabase.rpc("checkout", { p_payload: payload })

      if (error) {
        console.error("Supabase checkout RPC error:", error)
        throw new Error(error.message || "Failed to process order. Please try again.")
      }

      const createdOrderId = data as string
      if (!createdOrderId) {
        throw new Error("Order creation succeeded but no order ID was returned.")
      }

      // Successful checkout: clear cart now
      clear()

      // For authenticated users, retrieve order_number and payment record
      let fetchedOrderNumber = createdOrderId.slice(0, 8).toUpperCase()
      let fetchedPaymentId: string | undefined
      let fetchedAmount = subtotal + shippingFor(subtotal)

      if (user) {
        try {
          const { data: orderData } = await supabase
            .from("orders")
            .select("order_number, total_amount")
            .eq("id", createdOrderId)
            .single()

          if (orderData?.order_number) {
            fetchedOrderNumber = orderData.order_number
          }
          if (orderData?.total_amount) {
            fetchedAmount = Number(orderData.total_amount)
          }

          const { data: payData } = await supabase
            .from("payments")
            .select("id, amount, status")
            .eq("order_id", createdOrderId)
            .single()

          if (payData?.id) {
            fetchedPaymentId = payData.id
            if (payData.amount) {
              fetchedAmount = Number(payData.amount)
            }
          }
        } catch (fetchErr) {
          console.warn("Could not fetch order/payment details via RLS:", fetchErr)
        }
      }

      setOrderResult({
        orderId: createdOrderId,
        orderNumber: fetchedOrderNumber,
        paymentMethod: payment,
        paymentId: fetchedPaymentId,
        amount: fetchedAmount,
      })

      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during checkout."
      setErrorMessage(msg)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment proof upload for manual QR
  async function handleProofUpload(e: React.FormEvent) {
    e.preventDefault()
    setProofError(null)

    if (!proofFile) {
      setProofError("Please select a receipt image or PDF to upload.")
      return
    }

    if (!user) {
      setProofError("You must be signed in to upload a payment proof.")
      return
    }

    if (!orderResult?.paymentId) {
      setProofError("Payment record not found for this order. Please contact support.")
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(proofFile.type)) {
      setProofError("Unsupported file format. Please upload JPEG, PNG, WebP or PDF.")
      return
    }

    if (proofFile.size > MAX_FILE_SIZE) {
      setProofError("File size exceeds 5 MB limit. Please compress or select a smaller file.")
      return
    }

    setIsUploadingProof(true)
    const supabase = createClient()

    try {
      // Path convention: {user_id}/{payment_id}/{filename} (within bucket payment-proofs)
      const fileExt = proofFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const cleanFilename = `proof-${Date.now()}.${fileExt}`
      const storagePath = `${user.id}/${orderResult.paymentId}/${cleanFilename}`

      // 1. Upload to Storage bucket
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(storagePath, proofFile, {
          contentType: proofFile.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        throw new Error(uploadError.message || "Failed to upload file to storage. Please try again.")
      }

      // 2. Insert metadata into public.payment_proofs
      const { error: dbError } = await supabase.from("payment_proofs").insert({
        payment_id: orderResult.paymentId,
        storage_path: storagePath,
        original_filename: proofFile.name,
        mime_type: proofFile.type,
        file_size: proofFile.size,
        uploaded_by: user.id,
      })

      if (dbError) {
        console.error("Payment proof DB insert error:", dbError)
        throw new Error(dbError.message || "File uploaded, but failed to record proof metadata. Please try again.")
      }

      setProofSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload payment proof. Please try again."
      setProofError(msg)
    } finally {
      setIsUploadingProof(false)
    }
  }

  // --- VIEW: Order Success (COD or Completed QR) ---
  if (orderResult) {
    if (orderResult.paymentMethod === "cod") {
      return (
        <StoreShell>
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-9" />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Order confirmed!</h1>
              <p className="text-pretty text-sm text-muted-foreground">
                Thank you for your order. We have received your Cash on Delivery order and our fulfillment team will verify and dispatch it shortly.
              </p>
              <div className="my-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Order reference: </span>
                <span className="font-mono font-semibold text-foreground">{orderResult.orderNumber || orderResult.orderId}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button render={<Link href="/products">Continue shopping</Link>} />
              <Button variant="outline" render={<Link href="/account">View orders</Link>} />
            </div>
          </div>
        </StoreShell>
      )
    }

    // Manual QR Payment View
    return (
      <StoreShell>
        <div className="mx-auto max-w-2xl px-4 py-12 lg:px-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <QrCode className="size-7" />
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              Order Placed · Payment Required
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order reference: <span className="font-mono font-semibold text-foreground">{orderResult.orderNumber || orderResult.orderId}</span>
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              Total Amount: {formatPrice(orderResult.amount || subtotal)}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {/* Step 1: Scan Store QR & Pay */}
            <Card>
              <CardHeader>
                <CardTitle>{shopPaymentConfig.title}</CardTitle>
                <CardDescription>{shopPaymentConfig.instructions}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {shopPaymentConfig.isConfigured && shopPaymentConfig.qrCodeImageUrl ? (
                  <div className="relative size-64 overflow-hidden rounded-xl border border-border bg-white p-2 shadow-sm">
                    <Image
                      src={shopPaymentConfig.qrCodeImageUrl}
                      alt="Shop Payment QR Code"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Store Payment Details Pending</AlertTitle>
                    <AlertDescription>
                      The official store QR code is currently being configured by the merchant. If you already have the shop&apos;s direct payment details, you may complete the transfer and upload the receipt voucher below.
                    </AlertDescription>
                  </Alert>
                )}

                {shopPaymentConfig.accountName && (
                  <div className="w-full rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <p className="font-medium text-foreground">Beneficiary / Payee Details:</p>
                    <p className="text-muted-foreground">Name: <span className="text-foreground">{shopPaymentConfig.accountName}</span></p>
                    {shopPaymentConfig.bankName && <p className="text-muted-foreground">Bank: <span className="text-foreground">{shopPaymentConfig.bankName}</span></p>}
                    {shopPaymentConfig.accountNumber && <p className="text-muted-foreground">Account: <span className="font-mono text-foreground">{shopPaymentConfig.accountNumber}</span></p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Upload Payment Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Payment Proof</CardTitle>
                <CardDescription>
                  Upload a screenshot or PDF of your transaction receipt / voucher (Max 5MB).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {proofSuccess ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-6" />
                    </span>
                    <h3 className="font-semibold text-foreground">Payment Proof Uploaded!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your receipt has been submitted for verification. Staff will verify your transaction and update your order status.
                    </p>
                    <div className="mt-2 flex gap-3">
                      <Button render={<Link href="/products">Continue shopping</Link>} />
                      <Button variant="outline" render={<Link href="/account">View order status</Link>} />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProofUpload} className="flex flex-col gap-4">
                    {proofError && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Upload Error</AlertTitle>
                        <AlertDescription>{proofError}</AlertDescription>
                      </Alert>
                    )}

                    <Field>
                      <FieldLabel htmlFor="proofFile">Select receipt image or PDF</FieldLabel>
                      <Input
                        id="proofFile"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setProofFile(file)
                          setProofError(null)
                        }}
                        disabled={isUploadingProof}
                        required
                      />
                      <FieldDescription>Accepted formats: JPEG, PNG, WebP, PDF. Maximum file size: 5 MB.</FieldDescription>
                    </Field>

                    {proofFile && (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                        <FileText className="size-4 text-primary" />
                        <span className="truncate font-medium text-foreground">{proofFile.name}</span>
                        <span className="shrink-0">({(proofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}

                    <Button type="submit" disabled={isUploadingProof || !proofFile} className="w-full">
                      {isUploadingProof ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Uploading proof...
                        </>
                      ) : (
                        <>
                          <Upload className="size-4" />
                          Submit Payment Proof
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </StoreShell>
    )
  }

  // --- VIEW: Cart Empty ---
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

  // --- VIEW: Checkout Form ---
  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Checkout</h1>

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" />
            <AlertTitle>Checkout Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            {/* Customer Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Ram Bahadur"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="98XXXXXXXX"
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                    />
                    <FieldDescription>Order confirmation and receipts will be sent here.</FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address (Nepal)</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="address">Street address / Landmark</FieldLabel>
                    <Input
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      placeholder="e.g. New Road, House No. 45"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="province">Province</FieldLabel>
                      <Input
                        id="province"
                        name="province"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        required
                        placeholder="Bagmati"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="district">District</FieldLabel>
                      <Input
                        id="district"
                        name="district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        required
                        placeholder="Kathmandu"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="municipality">City / Municipality</FieldLabel>
                      <Input
                        id="municipality"
                        name="municipality"
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        required
                        placeholder="Kathmandu Metro"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="area">Area / Tole (Optional)</FieldLabel>
                      <Input
                        id="area"
                        name="area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. Baneshwor, Thamel"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="deliveryNotes">Delivery notes (Optional)</FieldLabel>
                      <Input
                        id="deliveryNotes"
                        name="deliveryNotes"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="e.g. Call before arrival"
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select how you would like to pay for your order.</CardDescription>
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

                {/* Authentication warning for Manual QR */}
                {payment === "manual_qr" && authChecked && !user && (
                  <Alert className="mt-4 border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200">
                    <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle>Sign-in Required for Manual QR</AlertTitle>
                    <AlertDescription className="text-xs">
                      Under our secure payment verification policies, uploading payment receipts requires an authenticated account.{" "}
                      <Link href="/account" className="font-semibold underline underline-offset-2 hover:text-foreground">
                        Sign in or register here
                      </Link>{" "}
                      before paying via QR, or select <strong>Cash on delivery</strong> to proceed as a guest.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Submit */}
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
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing order...
                    </>
                  ) : (
                    <>
                      <Truck className="size-4" />
                      Place order · {formatPrice(subtotal + shippingFor(subtotal))}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </StoreShell>
  )
}
