"use server"

import { createClient } from "@/lib/supabase/server"
import { products } from "@/lib/products"
import { invalidateStockCache } from "@/lib/inventory"

export interface CheckoutItemPayload {
  product_id: string
  quantity: number
}

export interface CheckoutPayload {
  customer_name: string
  customer_phone: string
  customer_email?: string
  province: string
  district: string
  municipality: string
  address: string
  area?: string
  delivery_notes?: string
  payment_method: string
  coupon_code?: string
  items: CheckoutItemPayload[]
}

export interface CheckoutActionResult {
  success: boolean
  orderId?: string
  error?: string
}

/**
 * Server-side order creation action.
 *
 * Security & authorization checks:
 * 1. Checks authenticated user session via server cookies.
 * 2. Queries public.profiles for the user's role.
 * 3. Rejects staff and owner roles from placing customer orders.
 * 4. Calls public.checkout(JSONB) RPC atomically on the database.
 */
export async function createCustomerOrder(
  payload: CheckoutPayload
): Promise<CheckoutActionResult> {
  const supabase = await createClient()

  // 1. Authoritative server-side role check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Error verifying user role during checkout:", profileError)
      return {
        success: false,
        error: "Unable to verify user account permissions. Please try again.",
      }
    }

    const role = profile?.role || "customer"

    if (role === "staff" || role === "owner") {
      return {
        success: false,
        error:
          "Staff and owner accounts cannot place customer orders. Please sign out or switch to a customer account.",
      }
    }
  }

  // 2. Execute database checkout RPC
  const { data, error } = await supabase.rpc("checkout", { p_payload: payload })

  if (error) {
    console.error("Supabase checkout RPC error:", error)
    invalidateStockCache()

    // Format user-friendly message for stock rejections while preserving database authority
    const stockMatch = error.message.match(/Insufficient stock for product ([a-f0-9-]+)\.?\s*Available:\s*(\d+),\s*requested:\s*(\d+)/i)
    if (stockMatch) {
      const productId = stockMatch[1]
      const available = stockMatch[2]
      const requested = stockMatch[3]
      const matchedProduct = products.find((p) => p.id === productId)
      const productName = matchedProduct ? matchedProduct.name : `product ${productId}`

      return {
        success: false,
        error: `Insufficient stock for ${productName}. Available: ${available}, requested: ${requested}. Please return to your cart and adjust quantity.`,
      }
    }

    return {
      success: false,
      error: error.message || "Failed to process order. Please try again.",
    }
  }

  // 3. Invalidate stock cache on success so subsequent views get fresh inventory
  invalidateStockCache()

  const createdOrderId = data as string
  if (!createdOrderId) {
    return {
      success: false,
      error: "Order creation succeeded but no order reference was returned.",
    }
  }

  return {
    success: true,
    orderId: createdOrderId,
  }
}

