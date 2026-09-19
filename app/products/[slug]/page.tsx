import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCategory, getProduct, getRelatedProducts, products } from "@/lib/products"
import { StoreShell } from "@/components/store/store-shell"
import { ProductDetail } from "@/components/store/product-detail"
import { ProductGrid } from "@/components/store/product-grid"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return { title: "Product not found" }
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [{ url: product.image }] },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const category = getCategory(product.category)
  const related = getRelatedProducts(product)

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {category && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href={`/categories/${category.slug}`} />}>
                    {category.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ProductDetail product={product} />

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-xl font-semibold tracking-tight text-foreground">You might also like</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </StoreShell>
  )
}
