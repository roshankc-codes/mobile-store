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
  | { type: "updateStock"; stockMap: Record<string, number> }
  | { type: "clear" }

const STORAGE_KEY = "himal-cart-v1"

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true }
    case "add": {
      if (action.product.stock <= 0) {
        return state
      }
      const existing = state.lines.find((l) => l.product.id === action.product.id)
      const currentQty = existing?.quantity ?? 0
      const nextQty = Math.min(currentQty + action.quantity, action.product.stock)
      if (nextQty <= 0) return state

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
    case "updateStock": {
      const lines = state.lines.map((l) => {
        if (action.stockMap[l.product.id] !== undefined) {
          const newStock = action.stockMap[l.product.id]
          return {
            ...l,
            product: {
              ...l.product,
              stock: newStock,
            },
          }
        }
        return l
      })
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
  refreshStock: () => Promise<void>
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

  const refreshStock = async () => {
    try {
      const res = await fetch("/api/stock")
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.stock) {
          dispatch({ type: "updateStock", stockMap: json.stock })
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  // Fetch live stock on mount and on window focus
  useEffect(() => {
    if (!state.hydrated) return
    refreshStock()

    const onFocus = () => refreshStock()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [state.hydrated])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.lines.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = state.lines.reduce((sum, l) => sum + l.quantity * l.product.price, 0)
    return {
      lines: state.lines,
      hydrated: state.hydrated,
      itemCount,
      subtotal,
      addItem: (product, quantity = 1) => {
        if (product.stock <= 0) return
        dispatch({ type: "add", product, quantity })
      },
      setQuantity: (productId, quantity) => dispatch({ type: "setQuantity", productId, quantity }),
      removeItem: (productId) => dispatch({ type: "remove", productId }),
      refreshStock,
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
