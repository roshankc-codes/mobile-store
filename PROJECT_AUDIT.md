# Project Audit

> **Scope:** Read-only inspection of the v0-generated frontend committed as `chore: initial v0 frontend`.
> No code was modified, no packages installed, no database accessed.
> Audit date: 2026-09-19.

---

## 1. Current Stack

| Item | Value | Source |
|---|---|---|
| Framework | **Next.js 16.3.3** (App Router) | `package.json` |
| Language | **TypeScript 5.7.3** | `package.json` |
| React version | **React 19** | `package.json` |
| Package manager | **pnpm 12.3.4** | `package.json` `packageManager` field |
| CSS framework | **Tailwind CSS v4.3.3** (via `@tailwindcss/postcss`) | `package.json`, `postcss.config.mjs` |
| Component library | **shadcn/ui** (style: `base-nova`; package: `shadcn ^4.11.0`) | `components.json`, `package.json` |
| Base UI primitives | **@base-ui/react ^1.5.0** (used by shadcn v4 `base-nova` style) | `package.json` |
| Icon library | **lucide-react ^1.16.0** | `package.json`, `components.json` |
| Animation | **tw-animate-css ^1.4.0** | `package.json`, `globals.css` |
| Toast notifications | **sonner ^2.0.8** | `package.json` |
| Theming | **next-themes ^0.4.6** | `package.json` (installed but ThemeProvider is NOT wired up) |
| Analytics | **@vercel/analytics 1.6.1** | `package.json`, `app/layout.tsx` |
| Fonts | **Inter** + **JetBrains Mono** via `next/font/google` | `app/layout.tsx` |
| Image handling | `next/image` with `unoptimized: true` | `next.config.mjs` |
| Rendering | Mix of RSC (most pages) and `"use client"` components | Inspected per file |
| Node types | `@types/node ^24` | `package.json` |

### Notable configuration flags

- **`typescript.ignoreBuildErrors: true`** in `next.config.mjs` — **POTENTIAL ISSUE**: TypeScript errors are suppressed at build time. This was typical for v0 scaffolding but must be removed before production.
- **`images.unoptimized: true`** — disables Next.js image optimisation; images are served as raw PNGs. Performance and cost concern for production.

---

## 2. Project Structure

```
MobileStore/
├── app/                            # Next.js App Router pages
│   ├── layout.tsx                  # Root layout — fonts, CartProvider, Toaster, Analytics
│   ├── page.tsx                    # Home page (/)
│   ├── globals.css                 # Tailwind v4 + shadcn design tokens
│   ├── account/page.tsx            # /account — sign-in / register UI (mock only)
│   ├── cart/page.tsx               # /cart — shopping cart (localStorage-backed)
│   ├── categories/[slug]/page.tsx  # /categories/:slug — category product listing
│   ├── checkout/page.tsx           # /checkout — checkout form (mock, no API)
│   ├── products/page.tsx           # /products — all products listing
│   ├── products/[slug]/page.tsx    # /products/:slug — product detail page
│   └── search/page.tsx             # /search?q= — search results
├── components/
│   ├── admin/
│   │   └── admin-nav.tsx           # Admin sidebar nav (links to unimplemented routes)
│   ├── store/
│   │   ├── home/
│   │   │   ├── hero.tsx            # Homepage hero section
│   │   │   └── category-tiles.tsx  # Category grid on homepage
│   │   ├── add-to-cart-button.tsx
│   │   ├── order-summary.tsx
│   │   ├── price.tsx
│   │   ├── product-card.tsx
│   │   ├── product-detail.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-listing.tsx     # Listing with filters + sort
│   │   ├── quantity-stepper.tsx
│   │   ├── rating.tsx
│   │   ├── site-footer.tsx
│   │   ├── site-header.tsx         # Sticky header: search, cart badge, mobile drawer
│   │   ├── stock-status.tsx
│   │   └── store-shell.tsx         # Layout wrapper: header + main + footer
│   └── ui/                         # 26 shadcn/ui components
│       └── [accordion, alert, avatar, badge, breadcrumb, button, card,
│            checkbox, dialog, dropdown-menu, empty, field, input, label,
│            pagination, radio-group, select, separator, sheet, skeleton,
│            slider, sonner, table, tabs, toggle, toggle-group]
├── lib/
│   ├── admin-data.ts               # Hardcoded mock admin orders + stats
│   ├── cart-context.tsx            # React Context + useReducer cart (localStorage)
│   ├── currency.ts                 # NRS formatter (en-IN lakh grouping)
│   ├── products.ts                 # Hardcoded product + category data (12 products)
│   ├── shipping.ts                 # Hardcoded shipping rules
│   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
├── public/
│   ├── products/                   # 12 PNG product images (230-572 KB each, unoptimised)
│   └── [icons, placeholders]
├── components.json                 # shadcn/ui config
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── pnpm-workspace.yaml
```

**Confirmed facts:**
- No `app/admin/` directory exists — the admin routes referenced in `admin-nav.tsx` (`/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`) are **not implemented**.
- No `app/login/` route — the footer links to `/login`, which returns a 404.
- No `robots.txt`, `sitemap.xml`, or `sitemap.ts` file exists under `app/` or `public/`.
- No `.env` or `.env.local` file exists in the repository.
- No API route handlers (`app/api/`) exist.

---

## 3. Routes

| Route | File | Type | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | RSC | Implemented |
| `/products` | `app/products/page.tsx` | RSC | Implemented |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | RSC + SSG | Implemented |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | RSC + SSG | Implemented |
| `/search` | `app/search/page.tsx` | RSC | Implemented |
| `/cart` | `app/cart/page.tsx` | Client | Implemented (localStorage only) |
| `/checkout` | `app/checkout/page.tsx` | Client | UI-only / mock |
| `/account` | `app/account/page.tsx` | Client | UI-only / mock |
| `/admin` | _(no file)_ | — | NOT IMPLEMENTED |
| `/admin/products` | _(no file)_ | — | NOT IMPLEMENTED |
| `/admin/orders` | _(no file)_ | — | NOT IMPLEMENTED |
| `/admin/customers` | _(no file)_ | — | NOT IMPLEMENTED |
| `/login` | _(no file)_ | — | NOT IMPLEMENTED (footer dead link) |

**Static params generation:** `/products/[slug]` and `/categories/[slug]` both call `generateStaticParams()` from the hardcoded arrays.

---

## 4. Components

### Store components (custom)

| Component | Rendering | Notes |
|---|---|---|
| `StoreShell` | RSC | Wraps all store pages with header + main + footer |
| `SiteHeader` | Client | Sticky; mobile drawer (Sheet); search form; cart badge from context |
| `SiteFooter` | RSC | Trust badges, category links, placeholder contact info |
| `Hero` | RSC | Static hero with hardcoded iPhone image |
| `CategoryTiles` | RSC | 5 category tiles from static data |
| `ProductListing` | Client | Filtering (brand checkboxes, in-stock toggle) + sort (4 keys); all client-side |
| `ProductGrid` | RSC | Responsive grid wrapper for `ProductCard` |
| `ProductCard` | RSC (uses Client child `AddToCartButton`) | Product thumbnail, price, rating, stock, add-to-cart |
| `ProductDetail` | Client | Full product view; quantity stepper + add to cart |
| `AddToCartButton` | Client | Calls `useCart().addItem`; shows toast on success |
| `QuantityStepper` | Client | Clamped increment/decrement; `aria-live` on value span |
| `OrderSummary` | RSC | Subtotal + shipping + total display |
| `Price` | RSC | Formats NRS price + optional original price / discount |
| `Rating` | RSC | Star display; `sr-only` text for screen readers |
| `StockStatus` | RSC | In stock / low stock / out of stock indicator |

### Admin components

| Component | Notes |
|---|---|
| `AdminNav` | Sidebar nav with links to 4 admin routes — **none of those routes exist** |

### shadcn/ui components (26)

All are standard shadcn `base-nova` generated components: `accordion`, `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `empty`, `field`, `input`, `label`, `pagination`, `radio-group`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner`, `table`, `tabs`, `toggle`, `toggle-group`.

---

## 5. Dependencies

### Production

| Package | Version | Purpose | Notes |
|---|---|---|---|
| `next` | 16.3.3 | Framework | Very recent |
| `react` / `react-dom` | ^19 | UI runtime | React 19 |
| `@base-ui/react` | ^1.5.0 | Low-level primitives for shadcn `base-nova` | OK |
| `shadcn` | ^4.11.0 | Component CLI | POTENTIAL ISSUE: `shadcn` as a runtime dep is unusual — it is normally a dev tool; harmless but slightly odd |
| `lucide-react` | ^1.16.0 | Icons | OK |
| `next-themes` | ^0.4.6 | Dark mode | POTENTIAL ISSUE: Installed but not wired up — no `ThemeProvider` in layout |
| `@vercel/analytics` | 1.6.1 | Analytics | Gated behind `NODE_ENV === "production"` |
| `sonner` | ^2.0.8 | Toast notifications | OK |
| `class-variance-authority` | ^0.7.1 | CVA for component variants | OK |
| `clsx` | ^2.1.1 | Class merging | OK |
| `cn` | ^0.3.0 | POTENTIAL ISSUE: Redundant — `cn()` is already defined in `lib/utils.ts`; this npm package is a duplicate utility |
| `tailwind-merge` | ^3.3.1 | Tailwind class deduplication | OK |
| `tw-animate-css` | ^1.4.0 | Animation utilities | OK |

### Development

| Package | Notes |
|---|---|
| `tailwindcss ^4.3.3` | OK |
| `@tailwindcss/postcss ^4.3.3` | OK |
| `typescript 5.7.3` | Pinned — good |
| `@types/node ^24` / `@types/react ^19` / `@types/react-dom ^19` | OK |
| `postcss ^8.5` | OK |

**No known high-severity CVEs were identified** in the dependency list at the time of inspection, but no automated audit (`pnpm audit`) was run.

---

## 6. Existing Customer Functionality

All items are **confirmed from code inspection**:

| Feature | Status | Notes |
|---|---|---|
| Browse homepage (featured + deals) | Real (static data) | |
| Browse all products | Real (static data) | |
| Browse by category | Real (static data) | |
| Product detail page | Real (static data) | |
| Search (`/search?q=`) | Real | Client-side substring filter on static data |
| Filter products by brand | Real | Client-side |
| Filter products — in stock only | Real | Client-side, reads static `stock` field |
| Sort products (featured / price asc/desc / rating) | Real | Client-side |
| Add to cart | Real | Client-side, localStorage-persisted |
| Adjust quantity in cart | Real | Client-side |
| Remove item from cart | Real | Client-side |
| Cart persistence across page loads | Real | localStorage key `himal-cart-v1` |
| Cart item count badge in header | Real | Derived from context |
| Free shipping threshold indicator | Real | >= Rs 50,000 = free |
| Checkout form (UI) | Real UI only | Collects name, phone, email, address, payment method |
| Checkout — order placement | **MOCK** | `handleSubmit` generates random `HM-XXXXXX` ID, calls `clear()`, shows success screen. No API call, no database write, no email sent. |
| Order confirmation screen | **MOCK** | States "A confirmation has been sent to your email" — this is false. |
| Account sign-in form | **MOCK** | Shows toast: "This is a front-end demo — no real account is created." |
| Account registration form | **MOCK** | Same as above |
| Order history (post sign-in) | Not implemented | No authenticated state, no orders API |

---

## 7. Existing Admin Functionality

| Feature | Status | Notes |
|---|---|---|
| Admin navigation component (`AdminNav`) | Component exists | Sidebar with links to Dashboard, Products, Orders, Customers |
| Admin dashboard page (`/admin`) | **NOT IMPLEMENTED** | No `app/admin/page.tsx` exists — returns 404 |
| Admin products page | Not implemented | |
| Admin orders page | Not implemented | |
| Admin customers page | Not implemented | |
| Mock order data (`lib/admin-data.ts`) | Data exists | 7 hardcoded orders with Nepali customer names |
| Mock stats (`lib/admin-data.ts`) | Data exists | Hardcoded revenue, orders, customers, conversion rate |
| `categoryRevenue()` function | Exists | Computes mock revenue from `reviewCount % 9` — **not real data** |
| Authentication gating for admin | **NOT IMPLEMENTED** | Admin link is publicly visible in footer and mobile menu |

---

## 8. Mock/Demo Functionality

The following are explicitly demo/mock and must be replaced before production:

1. **Product catalog** — 12 hardcoded products in `lib/products.ts`. No database connection.
2. **Stock numbers** — static integers in the same file. No real inventory system.
3. **Ratings and review counts** — hardcoded per product. No real review system.
4. **Checkout order placement** — generates a random local order ID; no server call.
5. **Order confirmation email** — claimed in UI but never sent.
6. **Account authentication** — forms fire a toast saying it is a demo; no session, no JWT, no backend.
7. **Admin stats** — hardcoded numbers in `lib/admin-data.ts`.
8. **Admin orders** — 7 hardcoded orders with no real data.
9. **`categoryRevenue()`** — uses `reviewCount % 9` as a proxy for sales volume, which is meaningless.
10. **Contact details** — phone `+977 1-000000` and email `hello@himalmobile.example` are placeholders.
11. **Footer "Demo store" label** — confirmed: `<p>Prices in Nepalese Rupees (Rs). Demo store.</p>` is rendered publicly.

---

## 9. Authentication

**CONFIRMED FACT: There is no authentication system in this codebase.**

- No session management (no cookies, no JWT, no session tokens).
- No authentication library (no NextAuth, Supabase Auth, Clerk, etc.).
- No `middleware.ts` file exists — no route protection at all.
- The `/account` page collects email + password but only shows a toast; credentials are never validated or stored.
- The admin link appears in the public footer and mobile navigation menu with no access control.

**Potential issue:** When admin routes are eventually added, the absence of a `middleware.ts` will mean they are publicly accessible by default.

---

## 10. Database/API

**CONFIRMED FACT: There is no database connection and no API layer in this codebase.**

- No Supabase client, Prisma, Drizzle, or any ORM.
- No `app/api/` directory — zero API route handlers.
- No `fetch()` calls in any component or page.
- No server actions (`"use server"` directive) anywhere.
- All data originates from static TypeScript arrays in `lib/products.ts` and `lib/admin-data.ts`.
- Cart state lives entirely in browser `localStorage`.

---

## 11. Environment Variables

**CONFIRMED FACT: No `.env` or `.env.local` file exists in the repository.**

The only `process.env` reference in the codebase is:

```tsx
// app/layout.tsx line 55
{process.env.NODE_ENV === "production" && <Analytics />}
```

This is a safe, standard Next.js pattern (not a secret).

**No hardcoded secrets, API keys, or credentials were found anywhere in the source code.**

**Potential issue:** When Supabase, payment gateways (eSewa/Khalti), or other services are integrated, a `.env.local` file will be required. The `.gitignore` already correctly excludes `.env` and `.env*.local`.

---

## 12. Media and File Handling

### Product images

- **12 PNG files** in `public/products/`, ranging from **231 KB to 572 KB** each.
- Images are served as static files — no CDN, no WebP conversion, no responsive sizing.
- `next/image` is used with `unoptimized: true` in `next.config.mjs`, so Next.js image optimisation is **disabled**.
- Images use correct `fill` layout with `sizes` props — but the benefit is negated by `unoptimized: true`.

### Image `alt` text

| Location | Alt text | Assessment |
|---|---|---|
| `ProductCard` | `product.name` | Descriptive |
| `ProductDetail` | `product.name` | Descriptive |
| `Hero` | `"Featured smartphone"` | POTENTIAL ISSUE: Generic — not product-specific |
| Cart `Image` | `line.product.name` | Descriptive |
| Checkout `Image` | `line.product.name` | Descriptive |

### File upload handling

- **None** — no file upload functionality exists anywhere in the codebase.

---

## 13. SEO

### Root metadata (`app/layout.tsx`)

| Field | Value | Assessment |
|---|---|---|
| `metadataBase` | `https://himal-mobile.example` | ISSUE: Placeholder URL — must be changed to the real domain before deployment |
| `title.default` | "Himal Mobile — Phones & Accessories in Nepal" | Good |
| `title.template` | `"%s · Himal Mobile"` | Good |
| `description` | Descriptive Nepal-focused text | Good |
| `keywords` | Nepal-focused | Reasonable |
| `openGraph.title` | Set | OK |
| `openGraph.description` | Set | OK |
| `openGraph.type` | `"website"` | Correct |
| `openGraph.locale` | `"en_NP"` | Correct for Nepal |
| `openGraph.images` | Not set at root level | MISSING: No default OG image |
| `generator` | `"v0.app"` | ISSUE: Must be removed — exposes that the site was generated by v0 |
| `canonical` | Not configured | MISSING |
| `robots` | Not configured | MISSING: No `robots.ts` / `robots.txt` |
| Twitter card | Not set | MISSING |

### Per-page metadata

| Route | `title` | `description` | OG image |
|---|---|---|---|
| `/` | Falls back to site default | Falls back to site default | Missing |
| `/products` | "All products" | Set | Missing |
| `/products/[slug]` | `product.name` | `product.description` | Set (`product.image`) |
| `/categories/[slug]` | `category.name` | `category.description` | Missing |
| `/search` | "Search" | Short but set | Missing |
| `/cart` | No metadata export | None | Missing |
| `/checkout` | No metadata export | None | Missing |
| `/account` | No metadata export | None | Missing |

### Structured data / JSON-LD

**CONFIRMED FACT: No JSON-LD (`application/ld+json`) structured data exists anywhere in the codebase.**

This is a significant omission for an ecommerce site — product pages should have `Product` schema, and the homepage should have `Organization` schema for Google Rich Results.

### Other SEO issues

- **`robots.txt`** — does not exist. Google cannot be instructed (e.g., to block `/checkout`, `/cart`, `/account`).
- **Sitemap** — does not exist. No `app/sitemap.ts` or `public/sitemap.xml`.
- **Canonical URLs** — not configured; duplicate content risk if the domain is ever served on multiple hostnames.
- **URL structure** — clean slugs (`/products/samsung-galaxy-s24-ultra`); good for SEO.
- **Heading hierarchy** — correct: `<h1>` on detail/listing pages, `<h2>` for sections.
- **Semantic HTML** — `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>` usage is correct. `StoreShell` wraps content in `<main>`.
- **Search is not blocked** — `/search?q=` results pages are generated server-side (RSC) but there is no `noindex` directive; these should be blocked in `robots.txt`.

---

## 14. Accessibility

| Check | Finding | Assessment |
|---|---|---|
| Native button semantics | Cart remove, filter clear, quantity buttons all use `<button type="button">` | Correct |
| Form labels | All checkout and account form inputs have matching `<label>` / `FieldLabel` with `htmlFor` | Correct |
| `aria-label` on icon buttons | Header buttons (menu, account, cart), QuantityStepper, remove button, search input all have `aria-label` | Correct |
| `aria-live` | QuantityStepper quantity display uses `aria-live="polite"` | Correct |
| `aria-hidden` on decorative elements | Star rating div, StockStatus dot use `aria-hidden="true"` | Correct |
| `sr-only` text | Rating component provides screenreader-friendly text | Correct |
| `role="search"` | Search form in header has correct role | Correct |
| `role="navigation"` / `aria-label` | Header nav elements and AdminNav have `aria-label` | Correct |
| Breadcrumb ARIA | Uses `aria-label="breadcrumb"`, `aria-current="page"`, `aria-disabled` | Correct |
| Keyboard focus styles | All interactive shadcn components use `focus-visible:ring` patterns | Correct |
| Focus trapping | Sheet/drawer components handle focus trapping natively via @base-ui/react | Correct |
| `lang` attribute | `lang="en"` set on `<html>` | Correct |
| Dark mode `colorScheme` | Set to `"light"` only in `viewport` export | POTENTIAL ISSUE: Dark mode CSS variables exist but `colorScheme: "light"` prevents browser from auto-applying dark chrome. `next-themes` `ThemeProvider` is installed but not wired up — dark mode toggle is non-functional. |
| Color contrast | Design uses neutral oklch scale (near-black on white). No concerns in code. | Needs visual audit on live site |
| Product image `alt` on hero | `alt="Featured smartphone"` | POTENTIAL ISSUE: Not descriptive of the specific product shown |
| Cart/checkout page `<title>` | No `metadata` export on these client pages | POTENTIAL ISSUE: Browser tab shows no page-specific title |
| Rating colour-only indicator | Stars change colour; screen-reader text provided via `sr-only` | Correct |
| Skip-to-content link | Not present | RECOMMENDATION: Add for keyboard users |

---

## 15. Performance

| Concern | Finding | Assessment |
|---|---|---|
| `images.unoptimized: true` | All 12 product images (231-572 KB each) served as raw PNG | ISSUE: Must be fixed before production — enable optimisation and convert to WebP |
| No CDN configuration | Images served from origin | Potential issue for Nepal-based traffic |
| Hero image `priority` | Set in `Hero` and `ProductDetail` | Correct LCP hint |
| `generateStaticParams` | Product and category pages are statically generated at build | Good — fast TTFB for product pages |
| Client-side filtering | All filtering and sorting happens in browser on full product array | Acceptable for 12 products; will need server-side pagination when catalog grows |
| Cart hydration | `hydrated` flag prevents cart flash-of-wrong-content on initial load | Correct pattern |
| `@vercel/analytics` | Only loaded in production | Correct |
| Font loading | `display: "swap"` on both fonts | Avoids FOIT |
| Product image `sizes` prop | Set per usage (e.g., `50vw`, `33vw`, `25vw`) | Correct — improves effective image selection once unoptimised is removed |
| `typescript.ignoreBuildErrors: true` | Masks potential runtime errors at deploy | Issue |
| `cn` npm package alongside custom `cn()` | Minor redundancy | Low impact |

---

## 16. Security Findings

### No secrets found

**CONFIRMED FACT: No API keys, tokens, passwords, or credentials were found in any source file.**

### Findings by category

#### Exposed/unsafe patterns

| Finding | Location | Severity | Classification |
|---|---|---|---|
| `typescript.ignoreBuildErrors: true` | `next.config.mjs` | Medium | Confirmed fact — TypeScript errors silent at build; could mask runtime failures |
| `generator: "v0.app"` in metadata | `app/layout.tsx` line 37 | Low | Confirmed fact — reveals the site origin to crawlers and attackers doing fingerprinting |
| `metadataBase` is a `.example` domain | `app/layout.tsx` line 22 | Medium | Confirmed fact — OG image URLs will resolve to the example domain in production if not changed |
| Admin link publicly visible | `site-header.tsx` (mobile nav), `site-footer.tsx` | High | Confirmed fact — The admin dashboard link is visible to all users with no authentication guard |
| No `middleware.ts` for route protection | Repository root | High | Confirmed fact — When admin pages are added, they will be publicly accessible until middleware is added |

#### localStorage usage

| Finding | Location | Assessment |
|---|---|---|
| Cart stored in `localStorage` as `himal-cart-v1` | `lib/cart-context.tsx` | Stored data contains only product details from the static catalog — no PII, no tokens. `JSON.parse` is wrapped in `try/catch`. Low risk for current mock state; once real user/order data is involved, localStorage is not a safe place for sensitive information. |
| `JSON.parse(raw)` on localStorage value | `lib/cart-context.tsx` line 77 | The parse is guarded by try/catch, so malformed data is handled. However, the parsed value is cast directly to `CartLine[]` without runtime schema validation (e.g., Zod). Potential issue: a crafted localStorage value could inject unexpected product data into cart state. Low real-world risk while data is mock only. |

#### Client-side authorization

| Finding | Assessment |
|---|---|
| No server-side checks exist anywhere | Not applicable yet (no backend); must be implemented before adding any real operations |
| Admin routes do not exist yet | When added, they must be protected server-side, not only by hiding the link |

#### XSS

- `dangerouslySetInnerHTML` was **not found** anywhere in the codebase. (Confirmed)
- All user-facing string interpolation goes through React JSX, which escapes by default. (Confirmed)
- Search query from `searchParams` is used only as a filter argument and rendered as text via JSX — no injection risk. (Confirmed)

#### URL/query parameter handling

- Search: `router.push(\`/search?q=${encodeURIComponent(q)}\`)` — properly encoded. (Confirmed)
- `searchParams.q` on the search page is awaited and `.trim()`d before use. (Confirmed)

#### Insecure file upload

- No file upload functionality exists. Not applicable.

#### Dependency risks

- `cn` npm package (version `^0.3.0`) is redundant alongside the local `cn()` utility but is not inherently malicious.
- `shadcn` as a production dependency is unusual (it is a CLI tool); harmless in practice.
- No obviously suspicious or abandoned packages identified.

---

## 17. Missing V1 Requirements

### Backend / Data

- [ ] **Database** — PostgreSQL (or equivalent). Currently all data is static TypeScript.
- [ ] **Product CRUD API** — create, read, update, delete products from a real data source.
- [ ] **Real inventory management** — `stock` field must be database-backed with transactional decrement on order placement to prevent overselling.
- [ ] **Order management** — create, persist, retrieve orders. Currently a local random ID is generated and immediately discarded.
- [ ] **Customer records** — no customer data storage.

### Authentication

- [ ] **Authentication system** — email/password or social login (e.g., Supabase Auth, NextAuth).
- [ ] **Session/JWT handling** — secure cookie-based sessions.
- [ ] **`middleware.ts`** — route protection for `/account`, `/checkout`, `/admin/*`.
- [ ] **Admin role check** — server-side authorization for all admin routes.

### Admin Dashboard (4 routes + layouts missing)

- [ ] `app/admin/page.tsx` — Dashboard (revenue, orders, conversion)
- [ ] `app/admin/products/` — Product management (CRUD)
- [ ] `app/admin/orders/` — Order management
- [ ] `app/admin/customers/` — Customer management
- [ ] Admin layout with `AdminNav` wired up

### Payment

- [ ] **eSewa / Khalti integration** — payment gateway API connection (currently UI placeholder only).
- [ ] **Cash-on-delivery order capture** — backend order creation.
- [ ] **Payment status webhooks** — handling gateway callbacks.

### Checkout

- [ ] **Server action or API route** for order placement — validates stock, reserves items, writes order to DB.
- [ ] **Stock lock / concurrency control** — PostgreSQL row-level locking during checkout to prevent overselling.
- [ ] **Order confirmation email** — transactional email (e.g., Resend, Brevo).

### Customer Account

- [ ] **Order history page** — authenticated view of past orders.
- [ ] **Profile management** — edit name, address, phone.
- [ ] **Wishlist** (if planned for V1).

### SEO / Discoverability

- [ ] Remove `generator: "v0.app"` from metadata.
- [ ] Update `metadataBase` to the real production domain.
- [ ] Add `robots.ts` (block `/cart`, `/checkout`, `/account`, `/admin/*`).
- [ ] Add `sitemap.ts` with all product and category URLs.
- [ ] Add `canonical` metadata.
- [ ] Add JSON-LD `Product` schema to `/products/[slug]`.
- [ ] Add JSON-LD `Organization` schema to homepage.
- [ ] Add Twitter/X card metadata.
- [ ] Add a default OG image.

### Performance

- [ ] Remove `images.unoptimized: true` — enable Next.js image optimisation.
- [ ] Configure a CDN for static assets / images.
- [ ] Remove `typescript.ignoreBuildErrors: true`.
- [ ] Consider server-side search + pagination once catalog exceeds ~50 products.

### Operational

- [ ] `.env.local` with real credentials (Supabase, payment keys, email service, etc.).
- [ ] Real phone number and email address in the footer.
- [ ] Remove "Demo store" label from footer.
- [ ] `robots.txt` to prevent indexing of non-public pages.
- [ ] `sitemap.xml` / dynamic sitemap.
- [ ] Skip-to-content link for accessibility.
- [ ] Error pages (`not-found.tsx`, `error.tsx`) for graceful failures.
- [ ] VAT handling — footer says "VAT included where applicable" but there is no VAT calculation.

---

## 18. Recommended Next Step

Based on this audit, the logical first implementation step is:

**Set up the data layer before touching any UI.**

1. **Choose and configure the backend** — Supabase (PostgreSQL) is a natural fit given the Nepal context, planned schema, and desire for Row Level Security. Alternatively, a self-hosted PostgreSQL with Drizzle/Prisma.
2. **Schema design** — `products`, `categories`, `orders`, `order_items`, `customers`, `inventory` tables.
3. **Seed the database** with the 12 existing products from `lib/products.ts` so the UI continues to work.
4. **Replace static data** — swap `lib/products.ts` static arrays with Server Component data fetches / server actions.
5. **Add authentication** (`middleware.ts`) before exposing any write operations.
6. **Add the admin layout and routes**, protected by the middleware.
7. Only then wire up real checkout and payment.

---

## Summary

### What is already good

- Clean Next.js App Router structure with correct RSC/client split.
- Fully typed TypeScript codebase with strict mode enabled.
- shadcn/ui `base-nova` component library is well-integrated and production-quality.
- Cart context is well-designed: `useReducer`, localStorage persistence, hydration guard, stock-capped quantity.
- Accessibility fundamentals are solid: ARIA labels, `sr-only` text, keyboard-focusable elements, semantic HTML.
- Nepal-specific localisation already in place: NRS currency with lakh grouping, en_NP locale, Nepal-focused metadata keywords.
- Search is correctly URL-param driven and input is safely encoded.
- Product and category static routes use `generateStaticParams` for fast SSG.
- No secrets or credentials in source code.

### What is UI-only

- **Checkout** — collects form data, generates a fake order ID, shows a success screen. No backend call.
- **Order confirmation email** — stated in UI but never sent.
- **Account sign-in / registration** — forms fire a toast saying it is a demo; no session or backend.
- **Admin routes** — `AdminNav` links to 4 routes that return 404.

### What is missing

Authentication, database, real product CRUD, real order placement, payment gateway integration, admin dashboard implementation, robots.txt, sitemap, JSON-LD structured data, canonical URLs, and server-side route protection middleware.

### Security concerns

1. **Admin link publicly visible** with no access control — must be fixed before adding admin pages.
2. **No `middleware.ts`** — all routes will be public by default until one is added.
3. **`typescript.ignoreBuildErrors: true`** — silently masks type errors at build time.
4. **`generator: "v0.app"`** — exposes the scaffolding origin.
5. **`metadataBase` placeholder domain** — will produce incorrect OG URLs in production.
6. **localStorage cart** — `JSON.parse` is guarded but the parsed value is not schema-validated; low risk now, must be reviewed if sensitive data is ever stored.

### SEO concerns

1. `generator: "v0.app"` metadata must be removed.
2. `metadataBase` must point to the real production domain.
3. No `robots.txt` or sitemap — crawlers have no guidance.
4. No JSON-LD structured data — product pages are missing `Product` schema (prices, availability, ratings visible to Google Rich Results).
5. No canonical URLs configured.
6. No default OG image for social sharing.
7. No Twitter/X card metadata.
8. Cart, checkout, and account pages have no `<title>` metadata exports.

### Recommended next step

**Set up Supabase (or equivalent PostgreSQL), design the schema, seed from existing mock data, and replace static data fetches — before any UI changes.** Authentication and `middleware.ts` should be added immediately after so that admin routes are protected from the moment they are created.
