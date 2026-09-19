import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Refreshes the Supabase session on every request so that auth tokens
 * are kept alive across the proxy layer.
 *
 * Called from `proxy.ts` at the project root -- the Next.js 16 successor
 * to `middleware.ts`.
 *
 * Security notes
 * --------------
 * - `getClaims()` verifies the JWT locally (using the project's signing
 *   keys) without a separate authoritative server round-trip for each
 *   request. It is used here solely to trigger session refresh and to
 *   validate the token structure; it is NOT used to make authorization
 *   decisions.
 * - Authorization decisions (e.g. admin access) must always be enforced
 *   server-side inside Route Handlers / Server Actions using `getUser()`
 *   and database RLS, never by inspecting cookies or claims at this layer.
 * - `getSession()` is intentionally NOT used: it reads the session from
 *   the client cookie without server-side validation and must not be
 *   trusted for security decisions.
 */
export async function updateSession(request: NextRequest) {
  // Start with a pass-through response; we will update its cookies below.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies back to both the mutated request (for
          // downstream handlers in this invocation) and the response (so
          // the browser receives the refreshed tokens).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims() verifies the JWT using the project's signing keys.
  // If the access token is close to expiry, @supabase/ssr refreshes it
  // automatically before returning, which causes setAll() above to run
  // and write the fresh tokens into supabaseResponse.
  //
  // We intentionally discard the returned claims here -- this layer must
  // not make authorization decisions based on client-supplied tokens.
  await supabase.auth.getClaims()

  return supabaseResponse
}
