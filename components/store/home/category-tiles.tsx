import Link from "next/link"
import { Smartphone, Headphones, BatteryCharging, ShieldCheck, Cable, ArrowRight } from "lucide-react"
import { categories, type CategorySlug } from "@/lib/products"

const icons: Record<CategorySlug, typeof Smartphone> = {
  smartphones: Smartphone,
  audio: Headphones,
  "power-charging": BatteryCharging,
  "cases-protection": ShieldCheck,
  "cables-adapters": Cable,
}

export function CategoryTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Shop by category</h2>
          <p className="text-sm text-muted-foreground">Find exactly what you need, faster.</p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/70"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => {
          const Icon = icons[c.slug]
          return (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/50"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium text-foreground">{c.name}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
