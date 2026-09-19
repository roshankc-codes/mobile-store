import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Returns a Supabase client scoped to the current server request.
 *
 * Must be called from Server Components, Server Actions, or Route Handlers.
 * Uses `cookies()` from `next/headers` so that the session is tied to the
 * incoming request. Cookie writes are silently ignored when called from
 * Server Components (read-only context); the proxy handles session refresh.
 *
 * Uses the public (publishable) key only -- the service-role key must never
 * be used here.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component -- cookies are read-only.
            // Session tokens are refreshed by the proxy before this runs.
          }
        },
      },
    }
  )
}
