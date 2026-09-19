// Nepalese Rupee formatting using the South Asian (lakh) digit grouping.
const formatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

export function formatPrice(amount: number): string {
  return `Rs ${formatter.format(Math.round(amount))}`
}

export function discountPercent(price: number, original?: number): number | null {
  if (!original || original <= price) return null
  return Math.round(((original - price) / original) * 100)
}
