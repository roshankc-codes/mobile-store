import type { Metadata } from "next"
import Link from "next/link"
import { SearchX } from "lucide-react"
import { products } from "@/lib/products"
import { StoreShell } from "@/components/store/store-shell"
import { ProductListing } from "@/components/store/product-listing"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export const metadata: Metadata = {
  title: "Search",
  description: "Search phones and accessories at Himal Mobile.",
}

function match(query: string) {
  const q = query.toLowerCase()
  return products.filter((p) =>
    [p.name, p.brand, p.description, ...p.highlights].join(" ").toLowerCase().includes(q),
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? "").trim()
  const results = query ? match(query) : []

  return (
    <StoreShell>
      {query && results.length > 0 ? (
        <ProductListing products={results} title={`Results for “${query}”`} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
          <Empty className="rounded-lg border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>{query ? `No results for “${query}”` : "Search our catalog"}</EmptyTitle>
              <EmptyDescription>
                {query
                  ? "Try a different keyword, brand, or category."
                  : "Type a product name, brand, or category in the search bar above."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" render={<Link href="/products">Browse all products</Link>} />
            </EmptyContent>
          </Empty>
        </div>
      )}
    </StoreShell>
  )
}
