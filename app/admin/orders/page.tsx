"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  Eye,
  XCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"

interface AdminOrderSummary {
  id: string
  order_number: number
  created_at: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  total_amount: number | string
  order_status: string
  payment_method: string
  payment_status: string
  order_items: { id: string; quantity: number }[]
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

function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Confirmed</Badge>
    case "payment_verification":
      return (
        <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
          Verification
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="secondary" className="border-purple-500/30 bg-purple-500/15 text-purple-700 dark:text-purple-400">
          Processing
        </Badge>
      )
    case "shipped":
      return (
        <Badge variant="secondary" className="border-indigo-500/30 bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
          Shipped
        </Badge>
      )
    case "delivered":
      return (
        <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          Delivered
        </Badge>
      )
    case "cancelled":
    case "payment_rejected":
      return <Badge variant="destructive">{status === "payment_rejected" ? "Payment Rejected" : "Cancelled"}</Badge>
    case "pending":
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

function PaymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return (
        <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          Verified
        </Badge>
      )
    case "awaiting_verification":
      return (
        <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
          Awaiting Verification
        </Badge>
      )
    case "rejected":
    case "failed":
      return <Badge variant="destructive">Rejected</Badge>
    case "pending":
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data, error: fetchErr } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          customer_name,
          customer_phone,
          customer_email,
          total_amount,
          order_status,
          payment_method,
          payment_status,
          order_items (
            id,
            quantity
          )
        `)
        .order("created_at", { ascending: false })

      if (fetchErr) throw fetchErr
      setOrders((data as unknown as AdminOrderSummary[]) || [])
    } catch (err: unknown) {
      console.error("Error fetching admin orders:", err)
      const msg = err instanceof Error ? err.message : "Failed to load orders."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function initialLoad() {
      const supabase = createClient()
      try {
        const { data, error: fetchErr } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            created_at,
            customer_name,
            customer_phone,
            customer_email,
            total_amount,
            order_status,
            payment_method,
            payment_status,
            order_items (
              id,
              quantity
            )
          `)
          .order("created_at", { ascending: false })

        if (ignore) return
        if (fetchErr) throw fetchErr
        setOrders((data as unknown as AdminOrderSummary[]) || [])
      } catch (err: unknown) {
        if (ignore) return
        const msg = err instanceof Error ? err.message : "Failed to load orders."
        setError(msg)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    initialLoad()

    return () => {
      ignore = true
    }
  }, [])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = orders.length
    const awaitingVerification = orders.filter((o) => o.payment_status === "awaiting_verification").length
    const pendingOrders = orders.filter((o) => o.order_status === "pending").length
    const confirmedOrders = orders.filter((o) => ["confirmed", "processing", "shipped"].includes(o.order_status)).length

    return { total, awaitingVerification, pendingOrders, confirmedOrders }
  }, [orders])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesNumber = String(o.order_number).includes(query)
        const matchesName = o.customer_name?.toLowerCase().includes(query)
        const matchesPhone = o.customer_phone?.toLowerCase().includes(query)
        const matchesEmail = o.customer_email?.toLowerCase().includes(query)

        if (!matchesNumber && !matchesName && !matchesPhone && !matchesEmail) {
          return false
        }
      }

      // Order Status
      if (orderStatusFilter !== "all" && o.order_status !== orderStatusFilter) {
        return false
      }

      // Payment Status
      if (paymentStatusFilter !== "all" && o.payment_status !== paymentStatusFilter) {
        return false
      }

      // Payment Method
      if (paymentMethodFilter !== "all" && o.payment_method !== paymentMethodFilter) {
        return false
      }

      return true
    })
  }, [orders, searchQuery, orderStatusFilter, paymentStatusFilter, paymentMethodFilter])

  function resetFilters() {
    setSearchQuery("")
    setOrderStatusFilter("all")
    setPaymentStatusFilter("all")
    setPaymentMethodFilter("all")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Order Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming orders, review customer information, and verify manual payments.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading} className="self-start sm:self-auto">
          <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Total Orders</CardDescription>
            <CardTitle className="text-2xl font-bold">{metrics.total}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">All store records</CardContent>
        </Card>

        <Card className={`shadow-none ${metrics.awaitingVerification > 0 ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Needs Verification
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {metrics.awaitingVerification}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
            Manual QR proofs pending review
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Pending Orders</CardDescription>
            <CardTitle className="text-2xl font-bold">{metrics.pendingOrders}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">Awaiting processing</CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Active Fulfillment</CardDescription>
            <CardTitle className="text-2xl font-bold">{metrics.confirmedOrders}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-muted-foreground">Confirmed / Shipped</CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="shadow-none">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by Order #, Customer, Phone, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Filter by order status"
              >
                <option value="all">Order Status: All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="payment_rejected">Payment Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Filter by payment status"
              >
                <option value="all">Payment: All</option>
                <option value="awaiting_verification">Awaiting Verification</option>
                <option value="verified">Verified (Paid)</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Filter by payment method"
              >
                <option value="all">Method: All</option>
                <option value="manual_qr">Manual QR</option>
                <option value="cod">Cash on Delivery</option>
              </select>

              {(searchQuery || orderStatusFilter !== "all" || paymentStatusFilter !== "all" || paymentMethodFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 px-2.5 text-xs text-muted-foreground">
                  <XCircle className="size-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table Card */}
      <Card className="shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <AlertCircle className="size-10 text-destructive" />
            <p className="text-base font-semibold text-foreground">Failed to load orders</p>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBag className="size-5 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No orders found</EmptyTitle>
                <EmptyDescription>
                  {orders.length === 0
                    ? "There are currently no customer orders in the system."
                    : "No orders match the selected filters or search query."}
                </EmptyDescription>
              </EmptyHeader>
              {orders.length > 0 && (
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[110px]">Order #</TableHead>
                  <TableHead className="min-w-[140px]">Date</TableHead>
                  <TableHead className="min-w-[180px]">Customer</TableHead>
                  <TableHead className="min-w-[120px]">Payment Method</TableHead>
                  <TableHead className="min-w-[150px]">Payment Status</TableHead>
                  <TableHead className="min-w-[130px]">Order Status</TableHead>
                  <TableHead className="text-right min-w-[110px]">Total</TableHead>
                  <TableHead className="w-[80px] sm:w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const itemCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0
                  const isAwaitingVerification = order.payment_status === "awaiting_verification"

                  return (
                    <TableRow key={order.id} className={isAwaitingVerification ? "bg-amber-500/5 hover:bg-amber-500/10" : undefined}>
                      <TableCell className="font-semibold text-foreground">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
                          #{order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm leading-tight">{order.customer_name}</span>
                          <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {order.payment_method === "manual_qr" ? (
                          <span className="font-semibold text-foreground">Manual QR</span>
                        ) : order.payment_method === "cod" ? (
                          <span>COD</span>
                        ) : (
                          order.payment_method
                        )}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.payment_status} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.order_status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground text-sm whitespace-nowrap">
                        {formatPrice(Number(order.total_amount))}
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/orders/${order.id}`} />}
                          className="h-8 w-8 p-0 sm:w-auto sm:px-2.5 text-xs font-medium sm:gap-1.5 border-border hover:bg-muted hover:text-foreground inline-flex items-center justify-center shadow-xs"
                          aria-label={`View order #${order.order_number}`}
                          title={`View order #${order.order_number}`}
                        >
                          <Eye className="size-3.5 shrink-0" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
