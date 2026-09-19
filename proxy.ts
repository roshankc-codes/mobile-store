import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

/**
 * Next.js 16 proxy -- runs on every matched request before Server Components
 * and Route Handlers execute.
 *
 * Responsibilities
 * ----------------
 * - Refresh the Supabase auth session so tokens are kept alive.
 * - Write refreshed auth cookies back to the response.
 *
 * This file must NOT make authorization decisions. Protecting individual
 * routes (e.g. /admin/*) must be done server-side inside the Route Handler
 * or Server Action using `getUser()` and database RLS.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     * - Next.js internal static assets  (_next/static)
     * - Optimized images                (_next/image)
     * - Browser-level files             (favicon.ico, robots.txt, sitemap.xml)
     * - Public media files              (images, fonts, icons)
     *
     * The proxy must run on all application routes so that Supabase auth
     * cookies are refreshed before any Server Component or handler reads them.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
