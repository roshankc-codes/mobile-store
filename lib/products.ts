export type CategorySlug = "smartphones" | "audio" | "power-charging" | "cases-protection" | "cables-adapters"

export interface Category {
  slug: CategorySlug
  name: string
  shortName: string
  description: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  category: CategorySlug
  price: number
  originalPrice?: number
  stock: number
  rating: number
  reviewCount: number
  image: string
  featured?: boolean
  highlights: string[]
  description: string
  specs: { label: string; value: string }[]
}

export const categories: Category[] = [
  {
    slug: "smartphones",
    name: "Smartphones",
    shortName: "Phones",
    description: "Flagship and everyday phones from the brands people trust.",
  },
  {
    slug: "audio",
    name: "Earbuds & Audio",
    shortName: "Audio",
    description: "Wireless earbuds and headphones for calls, music and travel.",
  },
  {
    slug: "power-charging",
    name: "Power & Charging",
    shortName: "Charging",
    description: "Fast chargers and power banks to keep you running all day.",
  },
  {
    slug: "cases-protection",
    name: "Cases & Protection",
    shortName: "Cases",
    description: "Rugged cases and screen protection built for daily life.",
  },
  {
    slug: "cables-adapters",
    name: "Cables & Adapters",
    shortName: "Cables",
    description: "Durable cables and adapters that just work.",
  },
]

export const products: Product[] = [
  {
    id: "p-01",
    slug: "samsung-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    category: "smartphones",
    price: 184999,
    originalPrice: 199999,
    stock: 12,
    rating: 4.8,
    reviewCount: 214,
    image: "/products/samsung-galaxy-s24-ultra.png",
    featured: true,
    highlights: ["6.8″ QHD+ Dynamic AMOLED", "Snapdragon 8 Gen 3", "200MP main camera", "5000mAh, 45W charging"],
    description:
      "The Galaxy S24 Ultra pairs a titanium frame with a brilliant 6.8-inch display and a 200MP camera system. Built-in Galaxy AI tools make everyday tasks faster, while the 5000mAh battery keeps up with a full day of work and play.",
    specs: [
      { label: "Display", value: "6.8″ QHD+ 120Hz AMOLED" },
      { label: "Processor", value: "Snapdragon 8 Gen 3" },
      { label: "RAM / Storage", value: "12GB / 256GB" },
      { label: "Rear camera", value: "200MP + 50MP + 12MP + 10MP" },
      { label: "Battery", value: "5000mAh, 45W wired" },
      { label: "Warranty", value: "1 year official Samsung Nepal" },
    ],
  },
  {
    id: "p-02",
    slug: "apple-iphone-15-pro",
    name: "Apple iPhone 15 Pro",
    brand: "Apple",
    category: "smartphones",
    price: 179900,
    stock: 8,
    rating: 4.9,
    reviewCount: 178,
    image: "/products/apple-iphone-15-pro.png",
    featured: true,
    highlights: ["6.1″ Super Retina XDR", "A17 Pro chip", "Titanium design", "Action button + USB-C"],
    description:
      "iPhone 15 Pro brings a strong-yet-light titanium design, the powerful A17 Pro chip and a versatile Pro camera system. The customisable Action button and USB-C connectivity make it more flexible than ever.",
    specs: [
      { label: "Display", value: "6.1″ Super Retina XDR 120Hz" },
      { label: "Processor", value: "A17 Pro" },
      { label: "Storage", value: "256GB" },
      { label: "Rear camera", value: "48MP + 12MP + 12MP" },
      { label: "Battery", value: "Up to 23 hrs video" },
      { label: "Warranty", value: "1 year Apple limited warranty" },
    ],
  },
  {
    id: "p-03",
    slug: "xiaomi-redmi-note-13-pro",
    name: "Xiaomi Redmi Note 13 Pro",
    brand: "Xiaomi",
    category: "smartphones",
    price: 42999,
    originalPrice: 47999,
    stock: 40,
    rating: 4.6,
    reviewCount: 356,
    image: "/products/xiaomi-redmi-note-13-pro.png",
    featured: true,
    highlights: ["6.67″ 120Hz AMOLED", "200MP camera", "67W turbo charging", "5100mAh battery"],
    description:
      "The Redmi Note 13 Pro delivers flagship-grade features at a mid-range price: a sharp 120Hz AMOLED screen, a 200MP main camera and 67W fast charging that tops up the 5100mAh battery in under an hour.",
    specs: [
      { label: "Display", value: "6.67″ 120Hz AMOLED" },
      { label: "Processor", value: "Snapdragon 7s Gen 2" },
      { label: "RAM / Storage", value: "8GB / 256GB" },
      { label: "Rear camera", value: "200MP + 8MP + 2MP" },
      { label: "Battery", value: "5100mAh, 67W" },
      { label: "Warranty", value: "1 year official Xiaomi Nepal" },
    ],
  },
  {
    id: "p-04",
    slug: "google-pixel-8",
    name: "Google Pixel 8",
    brand: "Google",
    category: "smartphones",
    price: 89999,
    stock: 0,
    rating: 4.7,
    reviewCount: 92,
    image: "/products/google-pixel-8.png",
    highlights: ["6.2″ Actua display", "Google Tensor G3", "Best-in-class camera", "7 years of updates"],
    description:
      "Pixel 8 is powered by Google Tensor G3 and the most helpful set of AI features on a phone. Its camera captures stunning photos in any light, backed by seven years of OS and security updates.",
    specs: [
      { label: "Display", value: "6.2″ 120Hz OLED" },
      { label: "Processor", value: "Google Tensor G3" },
      { label: "RAM / Storage", value: "8GB / 128GB" },
      { label: "Rear camera", value: "50MP + 12MP" },
      { label: "Battery", value: "4575mAh, 27W" },
      { label: "Warranty", value: "1 year international warranty" },
    ],
  },
  {
    id: "p-05",
    slug: "realme-12-pro-plus",
    name: "Realme 12 Pro+",
    brand: "Realme",
    category: "smartphones",
    price: 54999,
    originalPrice: 59999,
    stock: 23,
    rating: 4.5,
    reviewCount: 141,
    image: "/products/realme-12-pro-plus.png",
    highlights: ["6.7″ curved AMOLED", "Periscope telephoto", "67W SuperVOOC", "5000mAh battery"],
    description:
      "The Realme 12 Pro+ stands out with a periscope telephoto camera and an elegant curved AMOLED display. Fast 67W charging and a dependable 5000mAh battery round out a well-balanced package.",
    specs: [
      { label: "Display", value: "6.7″ 120Hz curved AMOLED" },
      { label: "Processor", value: "Snapdragon 7s Gen 2" },
      { label: "RAM / Storage", value: "12GB / 256GB" },
      { label: "Rear camera", value: "50MP + 64MP periscope + 8MP" },
      { label: "Battery", value: "5000mAh, 67W" },
      { label: "Warranty", value: "1 year official Realme Nepal" },
    ],
  },
  {
    id: "p-06",
    slug: "samsung-galaxy-a55",
    name: "Samsung Galaxy A55 5G",
    brand: "Samsung",
    category: "smartphones",
    price: 51999,
    stock: 31,
    rating: 4.4,
    reviewCount: 203,
    image: "/products/samsung-galaxy-a55.png",
    highlights: ["6.6″ Super AMOLED", "Exynos 1480", "50MP OIS camera", "IP67 water resistant"],
    description:
      "The Galaxy A55 5G brings a premium metal frame, a smooth Super AMOLED display and reliable cameras to the mid-range. IP67 water resistance and long software support make it a safe everyday choice.",
    specs: [
      { label: "Display", value: "6.6″ 120Hz Super AMOLED" },
      { label: "Processor", value: "Exynos 1480" },
      { label: "RAM / Storage", value: "8GB / 128GB" },
      { label: "Rear camera", value: "50MP OIS + 12MP + 5MP" },
      { label: "Battery", value: "5000mAh, 25W" },
      { label: "Warranty", value: "1 year official Samsung Nepal" },
    ],
  },
  {
    id: "p-07",
    slug: "apple-airpods-pro-2",
    name: "Apple AirPods Pro (2nd gen)",
    brand: "Apple",
    category: "audio",
    price: 34999,
    originalPrice: 38999,
    stock: 27,
    rating: 4.8,
    reviewCount: 312,
    image: "/products/apple-airpods-pro-2.png",
    featured: true,
    highlights: ["Active Noise Cancellation", "Adaptive Audio", "USB-C charging case", "Up to 6 hrs listening"],
    description:
      "AirPods Pro (2nd generation) deliver richer sound with up to 2x more Active Noise Cancellation. Adaptive Audio tailors noise control to your surroundings, and the USB-C case adds up to 30 hours of total battery.",
    specs: [
      { label: "Chip", value: "Apple H2" },
      { label: "Noise control", value: "ANC + Transparency + Adaptive" },
      { label: "Battery", value: "Up to 6 hrs (30 hrs with case)" },
      { label: "Charging", value: "USB-C, MagSafe, Qi" },
      { label: "Water resistance", value: "IP54" },
      { label: "Warranty", value: "1 year Apple limited warranty" },
    ],
  },
  {
    id: "p-08",
    slug: "jbl-tune-buds",
    name: "JBL Tune Buds",
    brand: "JBL",
    category: "audio",
    price: 8999,
    originalPrice: 10999,
    stock: 54,
    rating: 4.3,
    reviewCount: 187,
    image: "/products/jbl-tune-buds.png",
    highlights: ["Pure Bass sound", "Active Noise Cancellation", "48 hrs total battery", "IP54 rated"],
    description:
      "JBL Tune Buds combine punchy Pure Bass sound with active noise cancellation at an accessible price. With up to 48 hours of total battery and an IP54 rating, they are ready for the commute and the gym.",
    specs: [
      { label: "Driver", value: "10mm dynamic" },
      { label: "Noise control", value: "ANC + Ambient Aware" },
      { label: "Battery", value: "12 hrs (48 hrs with case)" },
      { label: "Charging", value: "USB-C" },
      { label: "Water resistance", value: "IP54" },
      { label: "Warranty", value: "1 year official JBL Nepal" },
    ],
  },
  {
    id: "p-09",
    slug: "anker-powercore-20000",
    name: "Anker PowerCore 20000mAh",
    brand: "Anker",
    category: "power-charging",
    price: 6499,
    stock: 63,
    rating: 4.7,
    reviewCount: 421,
    image: "/products/anker-powercore-20000.png",
    highlights: ["20000mAh capacity", "30W USB-C PD", "Charges phone ~4×", "Trickle-charge mode"],
    description:
      "The Anker PowerCore 20000mAh is a dependable travel companion, delivering 30W USB-C Power Delivery to fast-charge phones and tablets. A dedicated trickle-charge mode keeps earbuds and small devices topped up safely.",
    specs: [
      { label: "Capacity", value: "20000mAh" },
      { label: "Output", value: "30W USB-C PD" },
      { label: "Ports", value: "1× USB-C, 2× USB-A" },
      { label: "Recharge", value: "USB-C in" },
      { label: "Weight", value: "343g" },
      { label: "Warranty", value: "18 months Anker warranty" },
    ],
  },
  {
    id: "p-10",
    slug: "samsung-25w-charger",
    name: "Samsung 25W USB-C Charger",
    brand: "Samsung",
    category: "power-charging",
    price: 2299,
    originalPrice: 2799,
    stock: 88,
    rating: 4.6,
    reviewCount: 268,
    image: "/products/samsung-25w-charger.png",
    highlights: ["25W Super Fast Charging", "USB-C PD 3.0", "Compact design", "Wide device support"],
    description:
      "The official Samsung 25W USB-C wall charger delivers Super Fast Charging for compatible Galaxy phones and works with any USB-C PD device. Its compact build makes it an easy everyday and travel charger.",
    specs: [
      { label: "Output", value: "25W USB-C PD 3.0" },
      { label: "Standards", value: "PPS, PD" },
      { label: "Input", value: "100–240V" },
      { label: "Cable", value: "Sold separately" },
      { label: "Warranty", value: "1 year official Samsung Nepal" },
    ],
  },
  {
    id: "p-11",
    slug: "spigen-rugged-armor-s24",
    name: "Spigen Rugged Armor Case (S24 Ultra)",
    brand: "Spigen",
    category: "cases-protection",
    price: 2999,
    stock: 46,
    rating: 4.7,
    reviewCount: 156,
    image: "/products/spigen-rugged-armor-s24.png",
    highlights: ["Air Cushion corners", "Matte carbon finish", "Raised bezels", "Precise cutouts"],
    description:
      "Spigen Rugged Armor wraps your Galaxy S24 Ultra in shock-absorbing TPU with Air Cushion corners and a grippy matte carbon finish. Raised bezels protect the screen and cameras from scratches and drops.",
    specs: [
      { label: "Compatibility", value: "Galaxy S24 Ultra" },
      { label: "Material", value: "Flexible TPU" },
      { label: "Protection", value: "Air Cushion technology" },
      { label: "Finish", value: "Matte carbon" },
      { label: "Warranty", value: "6 months against defects" },
    ],
  },
  {
    id: "p-12",
    slug: "baseus-usb-c-cable-100w",
    name: "Baseus 100W USB-C Cable (1m)",
    brand: "Baseus",
    category: "cables-adapters",
    price: 1299,
    originalPrice: 1699,
    stock: 120,
    rating: 4.5,
    reviewCount: 340,
    image: "/products/baseus-usb-c-cable-100w.png",
    highlights: ["100W fast charging", "Braided nylon", "480Mbps data", "1 metre length"],
    description:
      "The Baseus 100W USB-C to USB-C cable supports fast charging for laptops and phones alike, wrapped in durable braided nylon. A tangle-free 1 metre length makes it a great daily driver at desk or on the go.",
    specs: [
      { label: "Power", value: "Up to 100W (20V/5A)" },
      { label: "Data", value: "480Mbps (USB 2.0)" },
      { label: "Length", value: "1 metre" },
      { label: "Build", value: "Braided nylon" },
      { label: "Warranty", value: "1 year Baseus warranty" },
    ],
  },
]

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit)
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.highlights.some((h) => h.toLowerCase().includes(q)),
  )
}
