import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { products } from "@/lib/products"
import { StoreShell } from "@/components/store/store-shell"
import { Hero } from "@/components/store/home/hero"
import { CategoryTiles } from "@/components/store/home/category-tiles"
import { ProductGrid } from "@/components/store/product-grid"

export default function HomePage() {
  const featured = products.filter((p) => p.featured)
  const deals = products.filter((p) => p.originalPrice).slice(0, 4)

  return (
    <StoreShell>
      <Hero />
      <CategoryTiles />

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Featured products</h2>
            <p className="text-sm text-muted-foreground">Hand-picked favourites our customers love.</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/70"
          >
            Shop all
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Deals of the week</h2>
            <p className="text-sm text-muted-foreground">Save more on top picks, while stocks last.</p>
          </div>
        </div>
        <ProductGrid products={deals} />
      </section>
    </StoreShell>
  )
}
