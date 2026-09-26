import type { Metadata } from "next"
import { getLiveProducts } from "@/lib/products.server"
import { StoreShell } from "@/components/store/store-shell"
import { ProductListing } from "@/components/store/product-listing"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "All products",
  description: "Browse all smartphones and accessories available at Himal Mobile.",
}

export default async function ProductsPage() {
  const products = await getLiveProducts()
  return (
    <StoreShell>
      <ProductListing products={products} title="All products" />
    </StoreShell>
  )
}
