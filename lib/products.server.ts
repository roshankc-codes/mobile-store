import "server-only"

import { products, type Product } from "@/lib/products"
import { getAuthoritativeStockMap } from "@/lib/inventory"

/**
 * Fetches all products enriched with authoritative live inventory from the database.
 *
 * Fallback rules:
 * - Inventory row exists with quantity > 0: use available_quantity
 * - Inventory row exists with quantity = 0: stock = 0
 * - Inventory row missing: stock = 0
 *
 * NEVER falls back to stale hardcoded product.stock.
 */
export async function getLiveProducts(): Promise<Product[]> {
  try {
    const stockMap = await getAuthoritativeStockMap()
    return products.map((p) => ({
      ...p,
      stock: stockMap[p.id] !== undefined ? stockMap[p.id] : 0,
    }))
  } catch (err) {
    console.error("Error loading live products:", err)
    return products.map((p) => ({
      ...p,
      stock: 0,
    }))
  }
}

/**
 * Fetches a single product by slug with authoritative live inventory.
 */
export async function getLiveProduct(slug: string): Promise<Product | undefined> {
  const live = await getLiveProducts()
  return live.find((p) => p.slug === slug)
}

/**
 * Fetches related products with authoritative live inventory.
 */
export async function getLiveRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const live = await getLiveProducts()
  return live.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit)
}

/**
 * Searches products using authoritative live inventory.
 */
export async function searchLiveProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const live = await getLiveProducts()
  return live.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.highlights.some((h) => h.toLowerCase().includes(q)),
  )
}
