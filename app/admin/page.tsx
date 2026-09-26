import Link from "next/link"
import {
  ShoppingBag,
  Clock,
  Truck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/currency"
import { Button } from "@/components/ui/button"
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

export const dynamic = "force-dynamic"

interface OrderRow {
  id: string
  order_number: number
  created_at: string
  customer_name: string
  customer_phone: string
  total_amount: number | string
  order_status: string
  payment_method: string
  payment_status: string
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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
        <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
          Needs Verification
        </Badge>
      )
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    case "pending":
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: ordersData, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      created_at,
      customer_name,
      customer_phone,
      total_amount,
      order_status,
      payment_method,
      payment_status
    `)
    .order("created_at", { ascending: false })

  const orders: OrderRow[] = (ordersData as unknown as OrderRow[]) || []

  // Metrics computation
  const totalOrders = orders.length
  const awaitingVerification = orders.filter((o) => o.payment_status === "awaiting_verification")
  const pendingOrders = orders.filter((o) => o.order_status === "pending")
  const activeFulfillment = orders.filter((o) => ["confirmed", "processing", "shipped"].includes(o.order_status))
  const verifiedRevenue = orders
    .filter((o) => o.payment_status === "verified")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  const recentOrders = orders.slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of store operations, payment verification queue, and fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/admin/orders" />}>
            Manage Orders
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load dashboard data: {error.message}
          </CardContent>
        </Card>
      )}

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Orders</span>
            <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{totalOrders}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">All customer orders</p>
        </Card>

        <Card className={awaitingVerification.length > 0 ? "border-amber-500/40 bg-amber-500/5 p-4 shadow-xs" : "p-4"}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Awaiting Verification</span>
            <span className={`rounded-md p-1.5 ${awaitingVerification.length > 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <div className={`mt-2 text-2xl font-bold tabular-nums ${awaitingVerification.length > 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>
            {awaitingVerification.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manual QR proofs pending</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Orders</span>
            <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{pendingOrders.length}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting confirmation</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Fulfillment</span>
            <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
              <Truck className="size-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground tabular-nums">{activeFulfillment.length}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Confirmed, processing, or shipped</p>
        </Card>

        <Card className="col-span-2 sm:col-span-1 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Verified Revenue</span>
            <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-600" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground tabular-nums">
            {formatPrice(verifiedRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">From verified payments</p>
        </Card>
      </div>

      {/* Attention Needed: Manual QR Verification Queue */}
      {awaitingVerification.length > 0 && (
        <Card className="border-amber-500/30 overflow-hidden">
          <CardHeader className="bg-amber-500/10 p-4 border-b border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Action Required: Payment Verification ({awaitingVerification.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    The following orders have uploaded manual QR payment proofs awaiting staff review.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/40 hover:bg-amber-500/20"
                render={<Link href="/admin/orders" />}
              >
                View in Orders
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[110px]">Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px] sm:w-[110px] text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awaitingVerification.map((order) => (
                    <TableRow key={order.id} className="hover:bg-amber-500/5">
                      <TableCell className="font-semibold text-primary">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          #{order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">{order.customer_name}</span>
                          <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs">
                          Manual QR
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm tabular-nums">
                        {formatPrice(Number(order.total_amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/orders/${order.id}`} />}
                          className="h-8 w-8 p-0 sm:w-auto sm:px-2.5 text-xs font-medium sm:gap-1.5 border-amber-500/40 hover:bg-amber-500/15 inline-flex items-center justify-center shadow-xs"
                          aria-label={`Review payment for order #${order.order_number}`}
                          title={`Review payment for order #${order.order_number}`}
                        >
                          <Eye className="size-3.5 shrink-0" />
                          <span className="hidden sm:inline">Review</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders Section */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border bg-muted/20">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Recent Orders</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              The latest customer orders placed on the store.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" render={<Link href="/admin/orders" />} className="text-xs gap-1">
            View All ({orders.length})
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[100px]">Order #</TableHead>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[160px]">Customer</TableHead>
                    <TableHead className="min-w-[140px]">Payment</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Total</TableHead>
                    <TableHead className="w-[80px] sm:w-[90px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/40">
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
                      <TableCell>
                        <PaymentStatusBadge status={order.payment_status} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.order_status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground text-sm whitespace-nowrap">
                        {formatPrice(Number(order.total_amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/orders/${order.id}`} />}
                          className="h-8 w-8 p-0 sm:w-auto sm:px-2.5 text-xs font-medium sm:gap-1.5 border-border hover:bg-muted hover:text-foreground inline-flex items-center justify-center shadow-xs"
                          aria-label={`View details for order #${order.order_number}`}
                          title={`View details for order #${order.order_number}`}
                        >
                          <Eye className="size-3.5 shrink-0" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
