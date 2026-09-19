export const FREE_SHIPPING_THRESHOLD = 50000
export const STANDARD_SHIPPING = 200

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING
}

export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
}
