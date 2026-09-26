import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trcevhuqlsqaaowguhtr.supabase.co"
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_RYS9a2LnXiS9fYcPy7IctQ_RYHE8aXG"

let supabaseClient: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return supabaseClient
}

let cachedStockMap: Record<string, number> | null = null
let lastFetchTime = 0
const CACHE_TTL_MS = 10000 // 10 seconds cache

/**
 * Invalidate in-memory stock cache so the next read fetches fresh data from DB.
 * Called immediately after order placement.
 */
export function invalidateStockCache() {
  lastFetchTime = 0
  cachedStockMap = null
}

interface StockRow {
  product_id: string
  available_quantity: number
}

/**
 * Fetches the authoritative available_quantity for all products from the database
 * using the read-only public.get_available_stock() RPC.
 *
 * Security:
 * - Requires only the standard Supabase publishable key.
 * - No staff email, staff password, or service-role key is used.
 * - public.inventory RLS remains enforced; only (product_id, available_quantity) is returned.
 *
 * Returns a dictionary of { [product_id]: available_quantity }.
 */
export async function getAuthoritativeStockMap(): Promise<Record<string, number>> {
  const now = Date.now()
  if (cachedStockMap && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedStockMap
  }

  try {
    const client = getClient()
    const { data, error } = await client.rpc("get_available_stock")

    if (error) {
      console.warn("Could not fetch authoritative stock via get_available_stock RPC:", error.message)
      return cachedStockMap || {}
    }

    const stockMap: Record<string, number> = {}
    if (data && Array.isArray(data)) {
      for (const item of data as StockRow[]) {
        stockMap[item.product_id] = Math.max(0, item.available_quantity ?? 0)
      }
    }

    cachedStockMap = stockMap
    lastFetchTime = now
    return stockMap
  } catch (err) {
    console.error("Unexpected error fetching authoritative stock:", err)
    return cachedStockMap || {}
  }
}
