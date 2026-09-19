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

export const metadata: Metadata = {
  metadataBase: new URL("https://himal-mobile.example"),
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
  generator: "v0.app",
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
