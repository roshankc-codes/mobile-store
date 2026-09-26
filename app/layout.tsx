import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  : process.env.VERCEL_URL
  ? new URL(`https://${process.env.VERCEL_URL}`)
  : new URL("http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Himal Mobile — Phones & Accessories in Nepal",
    template: "%s · Himal Mobile",
  },
  description:
    "Buy genuine smartphones, earbuds, chargers and accessories in Nepal. Authentic products, warranty support and delivery across the country.",
  keywords: ["mobile phones Nepal", "smartphones Kathmandu", "phone accessories Nepal", "buy phone online Nepal"],
  openGraph: {
    title: "Himal Mobile — Phones & Accessories in Nepal",
    description:
      "Buy genuine smartphones, earbuds, chargers and accessories in Nepal with warranty support and nationwide delivery.",
    type: "website",
    locale: "en_NP",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <CartProvider>{children}</CartProvider>
        <Toaster position="top-center" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
