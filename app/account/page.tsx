"use client"

import { useState } from "react"
import Link from "next/link"
import { Phone, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { StoreShell } from "@/components/store/store-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AccountPage() {
  const [tab, setTab] = useState("signin")

  function handleSubmit(e: React.FormEvent, kind: "signin" | "register") {
    e.preventDefault()
    toast.success(kind === "signin" ? "Signed in" : "Account created", {
      description: "This is a front-end demo — no real account is created.",
    })
  }

  return (
    <StoreShell>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 lg:py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Phone className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome to Himal Mobile</h1>
            <p className="text-sm text-muted-foreground">Sign in to track orders and save your wishlist.</p>
          </div>
        </div>

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
                    <Button type="submit" className="w-full">
                      Sign in
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
                    <Button type="submit" className="w-full">
                      Create account
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

        <p className="text-center text-xs text-muted-foreground">
          Store staff?{" "}
          <Link href="/admin" className="font-medium text-foreground underline underline-offset-2">
            Go to admin dashboard
          </Link>
        </p>
      </div>
    </StoreShell>
  )
}
