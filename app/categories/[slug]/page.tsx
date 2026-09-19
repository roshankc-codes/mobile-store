import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { categories, getCategory, products } from "@/lib/products"
import { StoreShell } from "@/components/store/store-shell"
import { ProductListing } from "@/components/store/product-listing"

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return { title: "Category not found" }
  return { title: category.name, description: category.description }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const items = products.filter((p) => p.category === category.slug)

  return (
    <StoreShell>
      <ProductListing products={items} title={category.name} />
    </StoreShell>
  )
}
