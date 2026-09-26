import { ReactNode } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/account?redirect=/admin")
  }

  // Authoritative server-side role check from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single()

  const role = profile?.role

  if (role !== "staff" && role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md text-center border-destructive/30 shadow-md">
          <CardHeader className="flex flex-col items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-8" />
            </span>
            <CardTitle className="text-xl font-bold tracking-tight">Access Restricted</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              You do not have permission to access the staff portal. Staff or owner credentials are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2">
            <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
              Signed in as <strong className="text-foreground">{user.email}</strong> (Role:{" "}
              <span className="capitalize text-foreground font-medium">{role || "unassigned"}</span>)
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
              <Button variant="outline" render={<Link href="/" />}>
                <ArrowLeft className="size-4 mr-2" />
                Return to Store
              </Button>
              <Button variant="default" render={<Link href="/account" />}>
                Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AdminShell userEmail={user.email} role={role}>
      {children}
    </AdminShell>
  )
}
