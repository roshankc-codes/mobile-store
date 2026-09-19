import Link from "next/link"
import { Phone, Truck, ShieldCheck, Headphones } from "lucide-react"
import { categories } from "@/lib/products"

const trust = [
  { icon: ShieldCheck, title: "100% genuine", desc: "Authentic products with official warranty" },
  { icon: Truck, title: "Nationwide delivery", desc: "Fast shipping across Nepal" },
  { icon: Headphones, title: "Local support", desc: "Help in Nepali & English, 7 days a week" },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-6 border-b border-border py-8 sm:grid-cols-3">
          {trust.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <t.icon className="size-4 text-foreground" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{t.title}</span>
                <span className="text-xs text-muted-foreground">{t.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Phone className="size-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">Himal Mobile</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Genuine smartphones and accessories, delivered across Nepal with warranty you can trust.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Shop</h3>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
              All products
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Account</h3>
            <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
              My account
            </Link>
            <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground">
              Cart
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Support</h3>
            <span className="text-sm text-muted-foreground">Kathmandu, Nepal</span>
            <a href="tel:+9771000000" className="text-sm text-muted-foreground hover:text-foreground">
              +977 1-000000
            </a>
            <a href="mailto:hello@himalmobile.example" className="text-sm text-muted-foreground hover:text-foreground">
              hello@himalmobile.example
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Himal Mobile. All rights reserved.</p>
          <p>Prices in Nepalese Rupees (Rs). Demo store.</p>
        </div>
      </div>
    </footer>
  )
}
