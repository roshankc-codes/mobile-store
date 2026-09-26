"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
  ArrowLeft,
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
import { createCustomerOrder, type CheckoutPayload } from "./actions"

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
const FORM_STORAGE_KEY = "himal_checkout_form_v1"

function getSavedFormField<T>(field: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const saved = sessionStorage.getItem(FORM_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed[field] !== undefined && parsed[field] !== null && parsed[field] !== "") {
        return parsed[field]
      }
    }
  } catch {
    // Ignore sessionStorage read errors
  }
  return defaultValue
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams.get("step")

  const { lines, subtotal, clear } = useCart()
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Form fields initialized with saved sessionStorage values
  const [fullName, setFullName] = useState(() => getSavedFormField("fullName", ""))
  const [phone, setPhone] = useState(() => getSavedFormField("phone", ""))
  const [email, setEmail] = useState(() => getSavedFormField("email", ""))
  const [address, setAddress] = useState(() => getSavedFormField("address", ""))
  const [province, setProvince] = useState(() => getSavedFormField("province", "Bagmati"))
  const [district, setDistrict] = useState(() => getSavedFormField("district", "Kathmandu"))
  const [municipality, setMunicipality] = useState(() =>
    getSavedFormField("municipality", "Kathmandu Metropolitan City")
  )
  const [area, setArea] = useState(() => getSavedFormField("area", ""))
  const [deliveryNotes, setDeliveryNotes] = useState(() => getSavedFormField("deliveryNotes", ""))
  const [payment, setPayment] = useState(() => getSavedFormField("payment", "cod"))

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  // Manual QR Proof Upload states
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [proofError, setProofError] = useState<string | null>(null)
  const [proofSuccess, setProofSuccess] = useState(false)
  const [existingOrderForProof, setExistingOrderForProof] = useState<{
    orderId: string
    paymentId: string
    orderNumber: string
    amount: number
  } | null>(null)

  const isStaffUser = userRole === "staff" || userRole === "owner"

  // Sync form inputs to sessionStorage so back navigation & refresh preserve data
  useEffect(() => {
    try {
      sessionStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify({
          fullName,
          phone,
          email,
          address,
          province,
          district,
          municipality,
          area,
          deliveryNotes,
          payment,
        })
      )
    } catch {
      // Ignore quota errors
    }
  }, [fullName, phone, email, address, province, district, municipality, area, deliveryNotes, payment])

  // Track authenticated user session & profile role
  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user)
        if (data.user?.email && !email) {
          setEmail(data.user.email)
        }
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle()
          if (isMounted) {
            setUserRole(profile?.role || "customer")
          }
        } else {
          if (isMounted) setUserRole(null)
        }
        if (isMounted) setAuthChecked(true)
      } catch (err) {
        console.error("Error loading user in checkout:", err)
        if (isMounted) setAuthChecked(true)
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      if (session?.user?.email && !email) {
        setEmail(session.user.email)
      }
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
        if (isMounted) {
          setUserRole(profile?.role || "customer")
        }
      } else {
        if (isMounted) setUserRole(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    // Security check: staff/owner cannot place orders
    if (isStaffUser) {
      setErrorMessage(
        "Staff and owner accounts cannot place customer orders. Please sign out or switch to a customer account."
      )
      return
    }

    if (lines.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before placing an order.")
      return
    }

    // Required fields check
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !province.trim() ||
      !district.trim() ||
      !municipality.trim()
    ) {
      setErrorMessage("Please complete all required delivery address fields.")
      return
    }

    // Manual QR payment branch: advance to payment step WITHOUT creating database order
    if (payment === "manual_qr") {
      if (!user) {
        setErrorMessage(
          "Manual QR payment requires payment proof upload. Please sign in or register your account before proceeding, or choose Cash on delivery."
        )
        return
      }

      // Push router state so Back button cleanly returns to checkout form
      router.push("/checkout?step=payment")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // COD branch: submit order directly via Server Action
    setIsSubmitting(true)

    try {
      const payload: CheckoutPayload = {
        customer_name: fullName.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || undefined,
        province: province.trim(),
        district: district.trim(),
        municipality: municipality.trim(),
        address: address.trim(),
        area: area.trim() || undefined,
        delivery_notes: deliveryNotes.trim() || undefined,
        payment_method: "cod",
        items: lines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      }

      const res = await createCustomerOrder(payload)
      if (!res.success || !res.orderId) {
        throw new Error(res.error || "Failed to process order. Please try again.")
      }

      const createdOrderId = res.orderId
      let fetchedOrderNumber = createdOrderId.slice(0, 8).toUpperCase()
      let fetchedAmount = subtotal + shippingFor(subtotal)

      const supabase = createClient()
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("order_number, total_amount")
          .eq("id", createdOrderId)
          .single()

        if (orderData?.order_number) {
          fetchedOrderNumber = String(orderData.order_number)
        }
        if (orderData?.total_amount) {
          fetchedAmount = Number(orderData.total_amount)
        }
      } catch (fetchErr) {
        console.warn("Could not fetch order details via RLS:", fetchErr)
      }

      // Successful order creation: clear cart and saved form
      clear()
      try {
        sessionStorage.removeItem(FORM_STORAGE_KEY)
      } catch {
        // Ignore
      }

      setOrderResult({
        orderId: createdOrderId,
        orderNumber: fetchedOrderNumber,
        paymentMethod: "cod",
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

  // Handle final Manual QR order creation & payment proof submission
  async function handleProofSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProofError(null)

    if (isStaffUser) {
      setProofError(
        "Staff and owner accounts cannot place customer orders. Please sign out or switch to a customer account."
      )
      return
    }

    if (!proofFile) {
      setProofError("Please select a receipt image or PDF to upload.")
      return
    }

    if (!user) {
      setProofError("You must be signed in to upload a payment proof.")
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
      let activeOrderId = existingOrderForProof?.orderId
      let activePaymentId = existingOrderForProof?.paymentId
      let activeOrderNumber = existingOrderForProof?.orderNumber
      let activeAmount = existingOrderForProof?.amount || subtotal + shippingFor(subtotal)

      // 1. Create order on database if not already created
      if (!activeOrderId || !activePaymentId) {
        const payload: CheckoutPayload = {
          customer_name: fullName.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || undefined,
          province: province.trim(),
          district: district.trim(),
          municipality: municipality.trim(),
          address: address.trim(),
          area: area.trim() || undefined,
          delivery_notes: deliveryNotes.trim() || undefined,
          payment_method: "manual_qr",
          items: lines.map((line) => ({
            product_id: line.product.id,
            quantity: line.quantity,
          })),
        }

        const res = await createCustomerOrder(payload)
        if (!res.success || !res.orderId) {
          throw new Error(res.error || "Failed to create order. Please try again.")
        }

        activeOrderId = res.orderId
        activeOrderNumber = activeOrderId.slice(0, 8).toUpperCase()

        // Fetch payment ID generated by checkout RPC
        const { data: orderData } = await supabase
          .from("orders")
          .select("order_number, total_amount")
          .eq("id", activeOrderId)
          .single()

        if (orderData?.order_number) {
          activeOrderNumber = String(orderData.order_number)
        }
        if (orderData?.total_amount) {
          activeAmount = Number(orderData.total_amount)
        }

        const { data: payData, error: payError } = await supabase
          .from("payments")
          .select("id, amount")
          .eq("order_id", activeOrderId)
          .single()

        if (payError || !payData?.id) {
          throw new Error("Order was registered, but payment details could not be found. Please contact support.")
        }

        const confirmedPaymentId = payData.id
        activePaymentId = confirmedPaymentId

        // Cache created order so retrying an upload never creates duplicate orders
        setExistingOrderForProof({
          orderId: activeOrderId,
          paymentId: confirmedPaymentId,
          orderNumber: activeOrderNumber,
          amount: activeAmount,
        })
      }

      if (!activeOrderId || !activePaymentId) {
        throw new Error("Missing active order or payment ID.")
      }

      // 2. Upload receipt to storage bucket: payment-proofs/{user_id}/{payment_id}/{cleanFilename}
      const fileExt = proofFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const cleanFilename = `proof-${Date.now()}.${fileExt}`
      const storagePath = `${user.id}/${activePaymentId}/${cleanFilename}`

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

      // 3. Insert metadata into public.payment_proofs
      const { error: dbError } = await supabase.from("payment_proofs").insert({
        payment_id: activePaymentId,
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

      // Order & proof completed successfully: clear cart and saved form
      clear()
      try {
        sessionStorage.removeItem(FORM_STORAGE_KEY)
      } catch {
        // Ignore
      }

      setProofSuccess(true)
      setOrderResult({
        orderId: activeOrderId,
        orderNumber: activeOrderNumber,
        paymentMethod: "manual_qr",
        paymentId: activePaymentId,
        amount: activeAmount,
      })

      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload payment proof. Please try again."
      setProofError(msg)
    } finally {
      setIsUploadingProof(false)
    }
  }

  // --- VIEW: Final Order Confirmation (COD or Verified QR Upload) ---
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

    // Manual QR Completed View
    return (
      <StoreShell>
        <div className="mx-auto max-w-2xl px-4 py-12 lg:px-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-7" />
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              Order Placed & Payment Submitted
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order reference: <span className="font-mono font-semibold text-foreground">{orderResult.orderNumber || orderResult.orderId}</span>
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              Total Amount: {formatPrice(orderResult.amount || subtotal)}
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
              <h3 className="font-semibold text-foreground">Payment Proof Uploaded!</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Your receipt has been submitted for verification. Staff will verify your transaction and update your order status.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button render={<Link href="/products">Continue shopping</Link>} />
                <Button variant="outline" render={<Link href="/account">View order status</Link>} />
              </div>
            </CardContent>
          </Card>
        </div>
      </StoreShell>
    )
  }

  // --- VIEW: Manual QR Payment Step (/checkout?step=payment) ---
  if (step === "payment" && payment === "manual_qr") {
    // If cart is empty and no pending order, prompt to browse
    if (lines.length === 0 && !existingOrderForProof) {
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

    const totalToPay = existingOrderForProof?.amount || subtotal + shippingFor(subtotal)

    return (
      <StoreShell>
        <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">
          {/* Visible Back Navigation Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to checkout form
          </Button>

          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <QrCode className="size-7" />
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              Manual QR Payment
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan the store QR code below, complete your payment, and attach your receipt.
            </p>
            <p className="mt-2 text-lg font-bold text-foreground">
              Total Amount: {formatPrice(totalToPay)}
            </p>
          </div>

          {/* Staff account alert */}
          {isStaffUser && (
            <Alert className="mb-6 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <AlertTitle>Staff Account Notice</AlertTitle>
              <AlertDescription>
                Staff and owner accounts cannot place customer orders. Please sign out or switch to a customer account.
              </AlertDescription>
            </Alert>
          )}

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
                    <p className="text-muted-foreground">
                      Name: <span className="text-foreground">{shopPaymentConfig.accountName}</span>
                    </p>
                    {shopPaymentConfig.bankName && (
                      <p className="text-muted-foreground">
                        Bank: <span className="text-foreground">{shopPaymentConfig.bankName}</span>
                      </p>
                    )}
                    {shopPaymentConfig.accountNumber && (
                      <p className="text-muted-foreground">
                        Account: <span className="font-mono text-foreground">{shopPaymentConfig.accountNumber}</span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Upload Payment Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Attach Payment Proof</CardTitle>
                <CardDescription>
                  Upload a screenshot or PDF of your transaction receipt / voucher (Max 5MB).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProofSubmit} className="flex flex-col gap-4">
                  {proofError && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Submission Error</AlertTitle>
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
                      disabled={isUploadingProof || isStaffUser}
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

                  <Button
                    type="submit"
                    disabled={isUploadingProof || !proofFile || isStaffUser}
                    className="w-full"
                  >
                    {isUploadingProof ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting order & payment proof...
                      </>
                    ) : isStaffUser ? (
                      "Staff accounts cannot place orders"
                    ) : existingOrderForProof ? (
                      <>
                        <Upload className="size-4" />
                        Retry Submitting Payment Proof
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Submit Order & Payment Proof
                      </>
                    )}
                  </Button>
                </form>
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

        {/* Staff/Owner Account Warning (Issue 2) */}
        {isStaffUser && (
          <Alert className="mb-6 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <AlertTitle>Staff Account Notice</AlertTitle>
            <AlertDescription>
              You are currently signed in as a staff/owner account ({user?.email}). Staff accounts cannot place customer orders.
              To place an order, please sign out or switch to a customer account.
            </AlertDescription>
          </Alert>
        )}

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
                      <Link href="/account?redirect=/checkout" className="font-semibold underline underline-offset-2 hover:text-foreground">
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

                {payment === "manual_qr" ? (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || isStaffUser}
                  >
                    {isStaffUser ? (
                      "Staff accounts cannot place orders"
                    ) : (
                      <>
                        Continue to Payment · {formatPrice(subtotal + shippingFor(subtotal))}
                        <ArrowRight className="ml-1.5 size-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || isStaffUser}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing order...
                      </>
                    ) : isStaffUser ? (
                      "Staff accounts cannot place orders"
                    ) : (
                      <>
                        <Truck className="size-4" />
                        Place order · {formatPrice(subtotal + shippingFor(subtotal))}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </StoreShell>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  )
}
