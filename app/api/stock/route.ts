import { NextResponse } from "next/server"
import { getAuthoritativeStockMap } from "@/lib/inventory"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stockMap = await getAuthoritativeStockMap()
    return NextResponse.json({ success: true, stock: stockMap })
  } catch (error) {
    console.error("Error in /api/stock:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock availability" },
      { status: 500 }
    )
  }
}
