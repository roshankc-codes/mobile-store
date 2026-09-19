"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Search, ShoppingBag, User, Phone } from "lucide-react"
import { categories } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function SearchForm({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const router = useRouter()
  const [value, setValue] = useState("")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    onSubmitted?.()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={onSubmit} className={cn("relative w-full", className)} role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search phones, earbuds, chargers…"
        className="h-10 pl-9"
        aria-label="Search products"
      />
    </form>
  )
}

export function SiteHeader() {
  const { itemCount, hydrated } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 lg:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Himal Mobile</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-2" aria-label="Categories">
              <SheetClose
                render={
                  <Link href="/products" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    All products
                  </Link>
                }
              />
              {categories.map((c) => (
                <SheetClose
                  key={c.slug}
                  render={
                    <Link
                      href={`/categories/${c.slug}`}
                      className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      {c.name}
                    </Link>
                  }
                />
              ))}
              <div className="my-2 border-t border-border" />
              <SheetClose
                render={
                  <Link href="/account" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                    My account
                  </Link>
                }
              />
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Himal Mobile home">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Phone className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">Himal Mobile</span>
        </Link>

        <SearchForm className="hidden flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" render={<Link href="/account" aria-label="My account" />}>
            <User />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            render={<Link href="/cart" aria-label={`Cart, ${itemCount} items`} />}
          >
            <ShoppingBag />
            {hydrated && itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="border-t border-border md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <SearchForm />
        </div>
      </div>

      <nav className="hidden border-t border-border md:block" aria-label="Product categories">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 lg:px-6">
          <Link
            href="/products"
            className="px-3 py-2.5 text-sm font-medium text-foreground hover:text-foreground/70"
          >
            All products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
