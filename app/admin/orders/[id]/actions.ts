"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { invalidateStockCache } from "@/lib/inventory"

export interface UpdateOrderStatusResult {
  success: boolean
  error?: string
}

export async function updateAdminOrderStatusAction(
  orderId: string,
  newStatus: string,
  note?: string
): Promise<UpdateOrderStatusResult> {
  const supabase = await createClient()

  // 1. Authoritative server-side role check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = profile?.role
  if (role !== "staff" && role !== "owner") {
    return { success: false, error: "Forbidden: Staff or owner permissions required." }
  }

  // 2. Call the database RPC
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_note: note || undefined,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // 3. Invalidate server stock cache immediately
  invalidateStockCache()

  // 4. Revalidate paths
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/products")
  revalidatePath("/")

  return { success: true }
}
