import type React from "react"
import { SiteHeader } from "@/components/store/site-header"
import { SiteFooter } from "@/components/store/site-footer"

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
