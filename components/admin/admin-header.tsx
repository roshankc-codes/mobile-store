"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Phone, LogOut, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AdminNav } from "@/components/admin/admin-nav"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface AdminHeaderProps {
  userEmail?: string
  role?: string
}

export function AdminHeader({ userEmail, role = "staff" }: AdminHeaderProps) {
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/account")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open admin navigation menu">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-4">
            <SheetHeader className="mb-4 text-left border-b border-border pb-3">
              <SheetTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Phone className="size-4" />
                </span>
                <span>Himal Mobile</span>
              </SheetTitle>
            </SheetHeader>
            <div onClick={() => setMobileNavOpen(false)}>
              <AdminNav />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground" aria-label="Himal Mobile admin">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Phone className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Himal Mobile</span>
            <span className="text-muted-foreground sm:inline hidden">/</span>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Staff Portal</span>
          </Link>
          <Badge variant="secondary" className="capitalize text-xs font-semibold">
            {role}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {userEmail && (
          <span className="hidden text-xs text-muted-foreground md:inline max-w-[200px] truncate" title={userEmail}>
            {userEmail}
          </span>
        )}

        <Button variant="outline" size="sm" render={<Link href="/" />}>
          <Store className="size-4" />
          <span className="hidden sm:inline">Storefront</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  )
}
