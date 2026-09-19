import type { Metadata } from "next"
import { products } from "@/lib/products"
import { StoreShell } from "@/components/store/store-shell"
import { ProductListing } from "@/components/store/product-listing"

export const metadata: Metadata = {
  title: "All products",
  description: "Browse all smartphones and accessories available at Himal Mobile.",
}

export default function ProductsPage() {
  return (
    <StoreShell>
      <ProductListing products={products} title="All products" />
    </StoreShell>
  )
}
