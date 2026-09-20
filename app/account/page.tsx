"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Phone, ShieldCheck, CheckCircle2, LogOut } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { StoreShell } from "@/components/store/store-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AccountPage() {
  const [tab, setTab] = useState("signin")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent, kind: "signin" | "register") {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const supabase = createClient()
    setLoading(true)

    try {
      if (kind === "signin") {
        const emailInput = form.querySelector("#signin-email") as HTMLInputElement
        const passwordInput = form.querySelector("#signin-password") as HTMLInputElement
        const email = emailInput?.value.trim()
        const password = passwordInput?.value

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          toast.error("Sign in failed", { description: error.message })
        } else {
          setUser(data.user)
          toast.success("Signed in successfully", { description: `Welcome back, ${data.user?.email}` })
        }
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
          toast.error("Registration failed", { description: error.message })
        } else {
          setUser(data.user)
          toast.success("Account created successfully", { description: `Signed up as ${data.user?.email}` })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    toast.success("Signed out successfully")
  }

  return (
    <StoreShell>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 lg:py-16">
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
          <Card>
            <CardHeader className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </span>
              <CardTitle className="text-lg">Account Active</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                <p className="text-muted-foreground">Account Email:</p>
                <p className="font-medium text-foreground">{user.email}</p>
                <p className="mt-1 text-muted-foreground">User ID:</p>
                <p className="font-mono text-muted-foreground">{user.id}</p>
              </div>
              <Button render={<Link href="/checkout">Go to Checkout</Link>} className="w-full" />
              <Button render={<Link href="/products">Browse Products</Link>} variant="outline" className="w-full" />
              <Button onClick={handleSignOut} variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </CardContent>
          </Card>
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
