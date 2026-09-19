import { products } from "@/lib/products"

export interface AdminOrder {
  id: string
  customer: string
  date: string
  items: number
  total: number
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
}

export const orders: AdminOrder[] = [
  { id: "HM-284913", customer: "Anisha Shrestha", date: "2026-09-18", items: 1, total: 234999, status: "Processing" },
  { id: "HM-284902", customer: "Bibek Tamang", date: "2026-09-18", items: 2, total: 41800, status: "Shipped" },
  { id: "HM-284877", customer: "Sujata Gurung", date: "2026-09-17", items: 1, total: 199999, status: "Delivered" },
  { id: "HM-284856", customer: "Rajan Karki", date: "2026-09-17", items: 3, total: 12700, status: "Pending" },
  { id: "HM-284831", customer: "Prakash Adhikari", date: "2026-09-16", items: 1, total: 74999, status: "Delivered" },
  { id: "HM-284810", customer: "Manisha Rai", date: "2026-09-16", items: 2, total: 89998, status: "Cancelled" },
  { id: "HM-284799", customer: "Deepak Thapa", date: "2026-09-15", items: 1, total: 54999, status: "Delivered" },
]

export const stats = {
  revenue: 4289500,
  orders: 342,
  customers: 1287,
  conversion: 3.4,
}

export function categoryRevenue() {
  const byCategory = new Map<string, number>()
  for (const p of products) {
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + p.price * (p.reviewCount % 9))
  }
  return Array.from(byCategory.entries()).map(([category, revenue]) => ({ category, revenue }))
}

export const statusStyles: Record<AdminOrder["status"], string> = {
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Shipped: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "bg-destructive/10 text-destructive",
}
