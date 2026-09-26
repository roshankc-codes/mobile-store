import { ReactNode } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminNav } from "@/components/admin/admin-nav"

interface AdminShellProps {
  children: ReactNode
  userEmail?: string
  role?: string
}

export function AdminShell({ children, userEmail, role }: AdminShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AdminHeader userEmail={userEmail} role={role} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 gap-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24 rounded-lg border border-border bg-card p-4 shadow-sm">
            <AdminNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
