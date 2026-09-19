"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useReducer } from "react"
import type { Product } from "@/lib/products"

export interface CartLine {
  product: Product
  quantity: number
}

interface CartState {
  lines: CartLine[]
  hydrated: boolean
}

type CartAction =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; product: Product; quantity: number }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }

const STORAGE_KEY = "himal-cart-v1"

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true }
    case "add": {
      const existing = state.lines.find((l) => l.product.id === action.product.id)
      const currentQty = existing?.quantity ?? 0
      const nextQty = Math.min(currentQty + action.quantity, action.product.stock)
      const lines = existing
        ? state.lines.map((l) => (l.product.id === action.product.id ? { ...l, quantity: nextQty } : l))
        : [...state.lines, { product: action.product, quantity: Math.min(action.quantity, action.product.stock) }]
      return { ...state, lines }
    }
    case "setQuantity": {
      const lines = state.lines
        .map((l) =>
          l.product.id === action.productId
            ? { ...l, quantity: Math.max(0, Math.min(action.quantity, l.product.stock)) }
            : l,
        )
        .filter((l) => l.quantity > 0)
      return { ...state, lines }
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.product.id !== action.productId) }
    case "clear":
      return { ...state, lines: [] }
    default:
      return state
  }
}

interface CartContextValue {
  lines: CartLine[]
  hydrated: boolean
  itemCount: number
  subtotal: number
  addItem: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const lines: CartLine[] = raw ? JSON.parse(raw) : []
      dispatch({ type: "hydrate", lines })
    } catch {
      dispatch({ type: "hydrate", lines: [] })
    }
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines))
    } catch {
      // ignore write failures (private mode, quota)
    }
  }, [state.lines, state.hydrated])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.lines.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = state.lines.reduce((sum, l) => sum + l.quantity * l.product.price, 0)
    return {
      lines: state.lines,
      hydrated: state.hydrated,
      itemCount,
      subtotal,
      addItem: (product, quantity = 1) => dispatch({ type: "add", product, quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: "setQuantity", productId, quantity }),
      removeItem: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
