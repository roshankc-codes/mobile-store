import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16 lg:px-6">
        <div className="flex flex-col items-start gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Official warranty · Genuine products
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            The latest phones, delivered across Nepal.
          </h1>
          <p className="max-w-md text-pretty text-base text-muted-foreground">
            Shop authentic smartphones, earbuds, chargers and accessories at honest prices — with warranty support and
            fast nationwide delivery.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" className="h-11 px-5" render={<Link href="/products" />}>
              Shop all products
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-5"
              render={<Link href="/categories/smartphones" />}
            >
              Browse phones
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-4/3 w-full max-w-md overflow-hidden rounded-xl border border-border bg-background">
          <Image
            src="/products/apple-iphone-15-pro.png"
            alt="Featured smartphone"
            fill
            priority
            sizes="(max-width: 768px) 90vw, 40vw"
            className="object-contain p-8"
          />
        </div>
      </div>
    </section>
  )
}
