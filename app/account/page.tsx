"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Package,
  Calendar,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { StoreShell } from "@/components/store/store-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPrice } from "@/lib/currency"
import { cn } from "@/lib/utils"

interface OrderItem {
  id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  line_total: number
}

interface CustomerOrder {
  id: string
  order_number: number
  created_at: string
  total_amount: number | string
  order_status: string
  payment_method: string
  payment_status: string
  order_items: OrderItem[]
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Confirmed</Badge>
    case "payment_verification":
      return (
        <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
          Payment Verification
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
      return <Badge variant="destructive">Cancelled</Badge>
    case "pending":
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

function getPaymentBadge(method: string, status: string) {
  const methodLabel = method === "manual_qr" ? "Manual QR" : method === "cod" ? "Cash on Delivery" : method.toUpperCase()
  const isPaid = status === "verified"
  const isPendingVerification = status === "awaiting_verification"

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span>
        Method: <strong className="font-medium text-foreground">{methodLabel}</strong>
      </span>
      <span>•</span>
      <span>Payment: </span>
      {isPaid ? (
        <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          Paid
        </Badge>
      ) : isPendingVerification ? (
        <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
          Awaiting Verification
        </Badge>
      ) : (
        <Badge variant="outline">Pending</Badge>
      )}
    </div>
  )
}

function AccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState("signin")
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isResolvingAuth, setIsResolvingAuth] = useState(true)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const isLoggingInRef = useRef(false)

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    setOrdersError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        created_at,
        total_amount,
        order_status,
        payment_method,
        payment_status,
        order_items (
          id,
          product_name,
          sku,
          quantity,
          unit_price,
          line_total
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      setOrdersError(error.message)
    } else {
      setOrders((data as unknown as CustomerOrder[]) || [])
    }
    setLoadingOrders(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    async function checkInitialAuth() {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle()

          if (!isMounted) return
          const role = profile?.role || "customer"

          if (role === "staff" || role === "owner") {
            const redirectParam = searchParams.get("redirect")
            const target =
              redirectParam && redirectParam.startsWith("/admin") && !redirectParam.startsWith("//")
                ? redirectParam
                : "/admin"
            router.replace(target)
            return // Keep isResolvingAuth true to avoid rendering customer UI during redirect
          }

          setUser(data.user)
          setUserRole(role)
          setIsResolvingAuth(false)
          fetchOrders()
        } else {
          setUser(null)
          setUserRole(null)
          setIsResolvingAuth(false)
        }
      } catch (err) {
        console.error("Error checking auth:", err)
        if (isMounted) setIsResolvingAuth(false)
      }
    }

    checkInitialAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      if (isLoggingInRef.current) {
        // Form submission redirect is in progress; skip updating local user state to prevent flash
        return
      }

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()

        if (!isMounted) return
        const role = profile?.role || "customer"

        if (role === "staff" || role === "owner") {
          const redirectParam = searchParams.get("redirect")
          const target =
            redirectParam && redirectParam.startsWith("/admin") && !redirectParam.startsWith("//")
              ? redirectParam
              : "/admin"
          router.replace(target)
          return
        }

        setUser(session.user)
        setUserRole(role)
        setIsResolvingAuth(false)
        fetchOrders()
      } else {
        setUser(null)
        setUserRole(null)
        setOrders([])
        setIsResolvingAuth(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchOrders, router, searchParams])

  async function handleSubmit(e: React.FormEvent, kind: "signin" | "register") {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const supabase = createClient()
    isLoggingInRef.current = true
    setLoading(true)

    try {
      if (kind === "signin") {
        const emailInput = form.querySelector("#signin-email") as HTMLInputElement
        const passwordInput = form.querySelector("#signin-password") as HTMLInputElement
        const email = emailInput?.value.trim()
        const password = passwordInput?.value

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          isLoggingInRef.current = false
          toast.error("Sign in failed", { description: error.message })
          setLoading(false)
          return
        }

        // Fetch authenticated user's profile role BEFORE setting user state
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        const role = profile?.role || "customer"

        if (role === "staff" || role === "owner") {
          toast.success("Signed in successfully", { description: `Welcome back, ${data.user?.email}` })
          const redirectParam = searchParams.get("redirect")
          const target =
            redirectParam && redirectParam.startsWith("/admin") && !redirectParam.startsWith("//")
              ? redirectParam
              : "/admin"
          // Keep loading true and redirect immediately without rendering customer account UI
          router.replace(target)
          router.refresh()
          return
        }

        // Customer sign-in: redirect to "/" (or safe non-admin internal redirectParam like /checkout)
        toast.success("Signed in successfully", { description: `Welcome back, ${data.user?.email}` })

        const redirectParam = searchParams.get("redirect")
        const isSafeInternalNonAdmin =
          redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("//") &&
          !redirectParam.startsWith("/admin") &&
          redirectParam !== "/account"

        const target = isSafeInternalNonAdmin ? redirectParam : "/"

        // Keep loading true and redirect immediately without rendering customer account dashboard
        router.replace(target)
        router.refresh()
        return
      } else {
        const nameInput = form.querySelector("#reg-name") as HTMLInputElement
        const emailInput = form.querySelector("#reg-email") as HTMLInputElement
        const passwordInput = form.querySelector("#reg-password") as HTMLInputElement
        const email = emailInput?.value.trim()
        const password = passwordInput?.value
        const fullName = nameInput?.value.trim()

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) {
          isLoggingInRef.current = false
          toast.error("Registration failed", { description: error.message })
          setLoading(false)
          return
        }

        toast.success("Account created successfully", { description: `Signed up as ${data.user?.email}` })
        router.replace("/")
        router.refresh()
        return
      }
    } catch (err: unknown) {
      isLoggingInRef.current = false
      setLoading(false)
      const msg = err instanceof Error ? err.message : "Authentication failed"
      toast.error(msg)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setOrders([])
    toast.success("Signed out successfully")
  }

  if (isResolvingAuth) {
    return (
      <StoreShell>
        <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RefreshCw className="size-5 animate-spin" />
          </span>
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </div>
      </StoreShell>
    )
  }

  return (
    <StoreShell>
      <div className={cn("mx-auto flex flex-col gap-8 px-4 py-10 lg:py-14", user ? "max-w-4xl" : "max-w-md")}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Phone className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {user ? "Your Account" : "Welcome to Himal Mobile"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Logged in as ${user.email}` : "Sign in to track orders and save your wishlist."}
            </p>
          </div>
        </div>

        {user ? (
          <div className="flex flex-col gap-8">
            {/* Account Overview Bar */}
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{user.email}</span>
                    <span className="font-mono text-xs text-muted-foreground">ID: {user.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(userRole === "staff" || userRole === "owner") && (
                    <Button variant="default" size="sm" render={<Link href="/admin" />}>
                      Staff Portal
                    </Button>
                  )}
                  <Button variant="outline" size="sm" render={<Link href="/products" />}>
                    Browse products
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order History Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Order History</h2>
                  {!loadingOrders && (
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                      {orders.length}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchOrders()}
                  disabled={loadingOrders}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <RefreshCw className={cn("size-3.5", loadingOrders && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {/* Loading State */}
              {loadingOrders && (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="h-16 bg-muted/30" />
                      <CardContent className="h-24 bg-muted/10" />
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loadingOrders && ordersError && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-destructive">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>Failed to load orders: {ordersError}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchOrders()}>
                      Try again
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!loadingOrders && !ordersError && orders.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Package className="size-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-foreground">No orders placed yet.</h3>
                      <p className="text-sm text-muted-foreground">
                        When you place orders, they will appear here with real-time status updates.
                      </p>
                    </div>
                    <Button render={<Link href="/products">Start shopping</Link>} className="mt-2" />
                  </CardContent>
                </Card>
              )}

              {/* Orders List */}
              {!loadingOrders && !ordersError && orders.length > 0 && (
                <div className="flex flex-col gap-4">
                  {orders.map((order) => {
                    const totalItems = order.order_items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0

                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="gap-2 border-b border-border/50 bg-muted/15 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-semibold text-foreground">
                                Order #{order.order_number}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="size-3.5" />
                                {formatDate(order.created_at)}
                              </span>
                            </div>
                            {getOrderStatusBadge(order.order_status)}
                          </div>
                          {getPaymentBadge(order.payment_method, order.payment_status)}
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 p-4">
                          <div className="divide-y divide-border/60 rounded-md border border-border/60 bg-muted/20 px-3">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                                <div className="flex flex-col pr-2">
                                  <span className="font-medium text-foreground">{item.product_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} × {formatPrice(Number(item.unit_price))} · SKU: {item.sku}
                                  </span>
                                </div>
                                <span className="shrink-0 font-medium tabular-nums text-foreground">
                                  {formatPrice(Number(item.line_total))}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-1 text-sm">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ShoppingBag className="size-3.5" />
                              {totalItems} {totalItems === 1 ? "item" : "items"}
                            </span>
                            <div>
                              <span className="mr-1.5 text-xs text-muted-foreground">Total Amount:</span>
                              <span className="text-base font-semibold tabular-nums text-foreground">
                                {formatPrice(Number(order.total_amount))}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="signin" className="flex-1">
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-5">
                  <CardTitle className="sr-only">Sign in</CardTitle>
                  <form onSubmit={(e) => handleSubmit(e, "signin")}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="signin-email">Email</FieldLabel>
                        <Input id="signin-email" type="email" autoComplete="email" required placeholder="you@example.com" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="signin-password">Password</FieldLabel>
                        <Input id="signin-password" type="password" autoComplete="current-password" required />
                      </Field>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                      </Button>
                    </FieldGroup>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-5">
                  <CardTitle className="sr-only">Register</CardTitle>
                  <form onSubmit={(e) => handleSubmit(e, "register")}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="reg-name">Full name</FieldLabel>
                        <Input id="reg-name" autoComplete="name" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                        <Input id="reg-email" type="email" autoComplete="email" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                        <Input id="reg-password" type="password" autoComplete="new-password" required />
                        <FieldDescription>At least 8 characters.</FieldDescription>
                      </Field>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
                      </Button>
                    </FieldGroup>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Your details are kept secure and private.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StoreShell>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountContent />
    </Suspense>
  )
}
