"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import type { Product } from "@/lib/products"
import { formatPrice } from "@/lib/currency"
import { ProductGrid } from "@/components/store/product-grid"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

type SortKey = "featured" | "price-asc" | "price-desc" | "rating"

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
}

function FilterControls({
  brands,
  activeBrands,
  onToggleBrand,
  inStockOnly,
  onToggleStock,
  onClear,
}: {
  brands: string[]
  activeBrands: string[]
  onToggleBrand: (brand: string) => void
  inStockOnly: boolean
  onToggleStock: (value: boolean) => void
  onClear: () => void
}) {
  const hasFilters = activeBrands.length > 0 || inStockOnly
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Brand</h3>
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {brands.map((brand) => {
            const id = `brand-${brand}`
            return (
              <div key={brand} className="flex items-center gap-2.5">
                <Checkbox
                  id={id}
                  checked={activeBrands.includes(brand)}
                  onCheckedChange={() => onToggleBrand(brand)}
                />
                <Label htmlFor={id} className="text-sm font-normal text-foreground">
                  {brand}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-2.5">
        <Checkbox id="in-stock" checked={inStockOnly} onCheckedChange={(v) => onToggleStock(Boolean(v))} />
        <Label htmlFor="in-stock" className="text-sm font-normal text-foreground">
          In stock only
        </Label>
      </div>
    </div>
  )
}

export function ProductListing({ products, title }: { products: Product[]; title: string }) {
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).sort(), [products])
  const [activeBrands, setActiveBrands] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>("featured")

  const toggleBrand = (brand: string) =>
    setActiveBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))

  const clearFilters = () => {
    setActiveBrands([])
    setInStockOnly(false)
  }

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      if (activeBrands.length > 0 && !activeBrands.includes(p.brand)) return false
      if (inStockOnly && p.stock <= 0) return false
      return true
    })
    switch (sort) {
      case "price-asc":
        return result.sort((a, b) => a.price - b.price)
      case "price-desc":
        return result.sort((a, b) => b.price - a.price)
      case "rating":
        return result.sort((a, b) => b.rating - a.rating)
      default:
        return result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    }
  }, [products, activeBrands, inStockOnly, sort])

  const priceRange = useMemo(() => {
    if (products.length === 0) return null
    const prices = products.map((p) => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {priceRange && (
          <p className="text-sm text-muted-foreground">
            {products.length} products · from {formatPrice(priceRange.min)}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <FilterControls
              brands={brands}
              activeBrands={activeBrands}
              onToggleBrand={toggleBrand}
              inStockOnly={inStockOnly}
              onToggleStock={setInStockOnly}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal data-icon="inline-start" />
                    Filters
                  </Button>
                }
              />
              <SheetContent side="left" className="w-80 p-6">
                <SheetHeader className="px-0">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterControls
                    brands={brands}
                    activeBrands={activeBrands}
                    onToggleBrand={toggleBrand}
                    inStockOnly={inStockOnly}
                    onToggleStock={setInStockOnly}
                    onClear={clearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <p className="hidden text-sm text-muted-foreground sm:block">
              Showing {filtered.length} of {products.length}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue>{sortLabels[sort]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {sortLabels[key]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length > 0 ? (
            <ProductGrid products={filtered} />
          ) : (
            <Empty className="rounded-lg border border-dashed border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SlidersHorizontal />
                </EmptyMedia>
                <EmptyTitle>No matching products</EmptyTitle>
                <EmptyDescription>Try removing a filter to see more results.</EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </Empty>
          )}
        </div>
      </div>
    </div>
  )
}
