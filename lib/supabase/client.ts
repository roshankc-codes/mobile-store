import { createBrowserClient } from "@supabase/ssr"

/**
 * Returns a Supabase client scoped to the browser.
 *
 * Safe to call from Client Components. Uses the public (publishable)
 * key only -- the service-role key must never be used here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
