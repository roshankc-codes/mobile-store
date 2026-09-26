"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  User,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface OrderItem {
  id: string
  product_id?: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number | string
  discount_amount: number | string
  line_total: number | string
}

interface PaymentRecord {
  id: string
  order_id: string
  payment_method: string
  amount: number | string
  status: string
  provider?: string
  provider_reference?: string
  verified_by?: string
  verified_at?: string
  created_at: string
}

interface PaymentProofRecord {
  id: string
  payment_id: string
  storage_path: string
  original_filename: string
  mime_type: string
  file_size: number
  uploaded_by?: string
  created_at: string
}

interface OrderStatusHistoryRecord {
  id: string
  order_id: string
  previous_status: string | null
  new_status: string
  changed_by: string | null
  note: string | null
  created_at: string
}

interface FullOrder {
  id: string
  order_number: number
  customer_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  province: string
  district: string
  municipality: string
  area: string | null
  address: string
  delivery_notes: string | null
  subtotal: number | string
  discount_amount: number | string
  delivery_fee: number | string
  total_amount: number | string
  payment_method: string
  payment_status: string
  order_status: string
  created_at: string
  updated_at: string
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [order, setOrder] = useState<FullOrder | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [proof, setProof] = useState<PaymentProofRecord | null>(null)
  const [history, setHistory] = useState<OrderStatusHistoryRecord[]>([])

  // Modal Actions
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [actionNote, setActionNote] = useState("")
  const [selectedNextStatus, setSelectedNextStatus] = useState("")
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  const fetchOrderData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // 1. Order details
      const { data: ordData, error: ordErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (ordErr) throw ordErr
      setOrder(ordData)
      setSelectedNextStatus(ordData.order_status)

      // 2. Order items
      const { data: itemData, error: itemErr } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("product_name", { ascending: true })

      if (itemErr) throw itemErr
      setItems(itemData || [])

      // 3. Payment record
      const { data: payData, error: payErr } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle()

      if (payErr) throw payErr
      setPayment(payData)

      // 4. Payment proof (if payment exists)
      if (payData?.id) {
        const { data: proofData, error: proofErr } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("payment_id", payData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (proofErr) console.warn("Could not fetch proof metadata:", proofErr)
        setProof(proofData)
      }

      // 6. Order status history
      const { data: histData, error: histErr } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })

      if (histErr) throw histErr
      setHistory(histData || [])
    } catch (err: unknown) {
      console.error("Error loading order details:", err)
      const msg = err instanceof Error ? err.message : "Failed to load order."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    let ignore = false

    async function initialLoad() {
      const supabase = createClient()
      try {
        const { data: ordData, error: ordErr } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single()

        if (ignore) return
        if (ordErr) throw ordErr
        setOrder(ordData)
        setSelectedNextStatus(ordData.order_status)

        const { data: itemData, error: itemErr } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId)
          .order("product_name", { ascending: true })

        if (ignore) return
        if (itemErr) throw itemErr
        setItems(itemData || [])

        const { data: payData, error: payErr } = await supabase
          .from("payments")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle()

        if (ignore) return
        if (payErr) throw payErr
        setPayment(payData)

        if (payData?.id) {
          const { data: proofData } = await supabase
            .from("payment_proofs")
            .select("*")
            .eq("payment_id", payData.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!ignore) {
            setProof(proofData)
          }
        }

        const { data: histData, error: histErr } = await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })

        if (ignore) return
        if (histErr) throw histErr
        setHistory(histData || [])
      } catch (err: unknown) {
        if (ignore) return
        const msg = err instanceof Error ? err.message : "Failed to load order."
        setError(msg)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    initialLoad()

    return () => {
      ignore = true
    }
  }, [orderId])

  // Payment Verification Handlers
  async function handleVerifyPayment(newStatus: "verified" | "rejected") {
    if (!payment?.id) {
      toast.error("No payment record associated with this order.")
      return
    }

    setIsSubmittingAction(true)
    const supabase = createClient()

    try {
      const { error: rpcErr } = await supabase.rpc("verify_payment", {
        p_payment_id: payment.id,
        p_new_status: newStatus,
        p_note: actionNote.trim() || undefined,
      })

      if (rpcErr) throw rpcErr

      toast.success(
        newStatus === "verified"
          ? "Payment approved successfully"
          : "Payment marked as rejected"
      )

      setApproveDialogOpen(false)
      setRejectDialogOpen(false)
      setActionNote("")
      await fetchOrderData()
    } catch (err: unknown) {
      console.error("Error verifying payment:", err)
      const msg = err instanceof Error ? err.message : "Verification action failed."
      toast.error("Failed to verify payment", { description: msg })
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // Order Status Update Handler
  async function handleUpdateOrderStatus() {
    if (!order?.id) return
    if (!selectedNextStatus || selectedNextStatus === order.order_status) {
      setStatusDialogOpen(false)
      return
    }

    setIsSubmittingAction(true)
    const supabase = createClient()

    try {
      const { error: rpcErr } = await supabase.rpc("update_order_status", {
        p_order_id: order.id,
        p_new_status: selectedNextStatus,
        p_note: actionNote.trim() || undefined,
      })

      if (rpcErr) throw rpcErr

      toast.success("Order status updated successfully", {
        description: `Status changed to ${selectedNextStatus}`,
      })

      setStatusDialogOpen(false)
      setActionNote("")
      await fetchOrderData()
    } catch (err: unknown) {
      console.error("Error updating order status:", err)
      const msg = err instanceof Error ? err.message : "Status update failed."
      toast.error("Failed to update status", { description: msg })
    } finally {
      setIsSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-4">
        <AlertTriangle className="size-12 text-destructive" />
        <h2 className="text-xl font-bold">Order not found</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error || "The requested order could not be retrieved."}</p>
        <Button variant="outline" render={<Link href="/admin/orders" />}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    )
  }

  const isTerminal = ["delivered", "refunded", "cancelled"].includes(order.order_status)
  const canVerifyPayment = payment && ["pending", "awaiting_verification"].includes(payment.status)

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Orders
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrderData} disabled={loading}>
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Order #{order.order_number}
            </h1>
            <Badge
              variant={
                order.order_status === "confirmed"
                  ? "default"
                  : order.order_status === "delivered"
                  ? "secondary"
                  : order.order_status === "cancelled" || order.order_status === "payment_rejected"
                  ? "destructive"
                  : "outline"
              }
              className="text-xs uppercase font-semibold tracking-wider"
            >
              {order.order_status.replace("_", " ")}
            </Badge>
            <Badge
              variant={
                order.payment_status === "verified"
                  ? "secondary"
                  : order.payment_status === "awaiting_verification"
                  ? "secondary"
                  : order.payment_status === "rejected"
                  ? "destructive"
                  : "outline"
              }
              className={
                order.payment_status === "awaiting_verification"
                  ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs"
                  : "text-xs"
              }
            >
              Payment: {order.payment_status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 flex items-center text-xs text-muted-foreground gap-1.5">
            <Calendar className="size-3.5" />
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        {/* Action button in header */}
        {!isTerminal && (
          <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
            Update Order Status
          </Button>
        )}
      </div>

      {/* Main Grid: 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Customer Details */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Order Items */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Ordered Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.product_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right text-xs">{formatPrice(Number(item.unit_price))}</TableCell>
                      <TableCell className="text-center text-xs font-semibold">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatPrice(Number(item.line_total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>

            {/* Financial Totals */}
            <CardFooter className="flex flex-col gap-1.5 p-4 bg-muted/20 border-t border-border text-sm">
              <div className="flex justify-between w-full text-muted-foreground text-xs">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between w-full text-emerald-600 dark:text-emerald-400 text-xs">
                  <span>Discount</span>
                  <span>-{formatPrice(Number(order.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between w-full text-muted-foreground text-xs">
                <span>Delivery Fee</span>
                <span>
                  {Number(order.delivery_fee) === 0 ? "Free" : formatPrice(Number(order.delivery_fee))}
                </span>
              </div>
              <div className="flex justify-between w-full pt-2 mt-1 border-t border-border font-bold text-base text-foreground">
                <span>Total Amount</span>
                <span className="text-primary">{formatPrice(Number(order.total_amount))}</span>
              </div>
            </CardFooter>
          </Card>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Full Name</span>
                  <span className="font-medium text-foreground">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {order.customer_phone}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Email</span>
                  <span className="text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {order.customer_email || "Not provided (Guest checkout)"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Account Type</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {order.customer_id ? "Registered Customer" : "Guest Checkout"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Province & District</span>
                  <span className="font-medium text-foreground">
                    {order.province}, {order.district}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Municipality / Area</span>
                  <span className="text-foreground">
                    {order.municipality} {order.area ? `(${order.area})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Street Address</span>
                  <span className="text-foreground">{order.address}</span>
                </div>
                {order.delivery_notes && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Delivery Notes</span>
                    <span className="text-xs italic text-muted-foreground bg-muted/40 p-2 rounded block">
                      &ldquo;{order.delivery_notes}&rdquo;
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Col: Payment Verification & Status Updater */}
        <div className="flex flex-col gap-6">
          {/* Payment Card */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {order.payment_method === "manual_qr" ? (
                    <QrCode className="size-4 text-primary" />
                  ) : (
                    <CreditCard className="size-4 text-primary" />
                  )}
                  Payment Details
                </CardTitle>
                <Badge variant="outline" className="text-xs uppercase font-semibold">
                  {order.payment_method === "manual_qr"
                    ? "Manual QR"
                    : order.payment_method === "cod"
                    ? "COD"
                    : order.payment_method}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4 text-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Expected Amount:</span>
                <span className="font-semibold text-foreground text-sm">{formatPrice(Number(order.total_amount))}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge
                  variant={
                    payment?.status === "verified"
                      ? "secondary"
                      : payment?.status === "awaiting_verification"
                      ? "secondary"
                      : payment?.status === "rejected"
                      ? "destructive"
                      : "outline"
                  }
                  className={
                    payment?.status === "awaiting_verification"
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : ""
                  }
                >
                  {payment?.status ? payment.status.replace("_", " ") : "Pending"}
                </Badge>
              </div>

              {payment?.verified_at && (
                <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">Verified Record</div>
                  <div>At: {formatDate(payment.verified_at)}</div>
                  {payment.verified_by && <div className="truncate">By Staff ID: {payment.verified_by}</div>}
                </div>
              )}

              {/* Manual QR Proof Section */}
              {order.payment_method === "manual_qr" && (
                <div className="pt-3 border-t border-border flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                    Payment Proof Receipt
                    {proof && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {formatFileSize(proof.file_size)}
                      </span>
                    )}
                  </span>

                  {proof ? (
                    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 bg-muted/10">
                      {proof.mime_type.startsWith("image/") ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded border border-border bg-black/5 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/admin/orders/${orderId}/proof`}
                            alt="Customer payment proof receipt"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded border border-border bg-muted/30 text-center text-xs">
                          <FileText className="size-8 mx-auto mb-2 text-primary" />
                          <span>PDF Document ({proof.original_filename})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="truncate max-w-[150px] text-muted-foreground text-[11px]" title={proof.original_filename}>
                          {proof.original_filename}
                        </span>
                        <a
                          href={`/api/admin/orders/${orderId}/proof`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:underline font-medium"
                        >
                          View Full Size
                          <ExternalLink className="size-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No payment receipt uploaded by customer yet.
                    </div>
                  )}

                  {/* Verification Decision Buttons */}
                  {canVerifyPayment && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setApproveDialogOpen(true)}
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setRejectDialogOpen(true)}
                      >
                        <XCircle className="size-4 mr-1.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History Timeline */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Status History ({history.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recorded transitions yet.</p>
              ) : (
                <div className="relative pl-4 space-y-4 border-l-2 border-border">
                  {history.map((h, i) => (
                    <div key={h.id || i} className="relative group text-xs">
                      <div className="absolute -left-[21px] top-0.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground capitalize">
                          {h.new_status.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(h.created_at)}</span>
                      </div>
                      {h.note && (
                        <p className="mt-1 text-muted-foreground bg-muted/30 p-1.5 rounded text-[11px]">
                          {h.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* APPROVE PAYMENT CONFIRMATION DIALOG */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
              Approve Payment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payment? This will update the payment status to{" "}
              <strong>verified</strong> and advance the order to <strong>confirmed</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground block">
              Staff Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Transaction confirmed in mobile banking"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setApproveDialogOpen(false)} disabled={isSubmittingAction}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleVerifyPayment("verified")}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT PAYMENT CONFIRMATION DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" />
              Reject Payment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this payment? The payment will be marked as <strong>rejected</strong> and
              the order will move to <strong>payment_rejected</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground block">
              Reason for Rejection (Recommended)
            </label>
            <input
              type="text"
              placeholder="e.g. Illegible screenshot, invalid reference number"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)} disabled={isSubmittingAction}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleVerifyPayment("rejected")}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPDATE ORDER STATUS DIALOG */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Transition order #{order.order_number} to the next stage in fulfillment lifecycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">New Status</label>
              <select
                value={selectedNextStatus}
                onChange={(e) => setSelectedNextStatus(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Staff Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Handed over to courier with tracking #98234"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)} disabled={isSubmittingAction}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleUpdateOrderStatus} disabled={isSubmittingAction}>
              {isSubmittingAction ? "Updating..." : "Save Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
