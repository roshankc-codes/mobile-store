import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params

  if (!orderId) {
    return new Response(JSON.stringify({ error: "Missing order ID" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  const supabase = await createClient()

  // 1. Authenticate user from session cookies
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  // 2. Authoritative role check: must be staff or owner
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Error fetching user profile for proof authorization:", profileError)
    return new Response(JSON.stringify({ error: "Internal authorization error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  const role = profile?.role
  if (role !== "staff" && role !== "owner") {
    return new Response(
      JSON.stringify({ error: "Forbidden: Staff or owner permissions required" }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
        },
      }
    )
  }

  // 3. Locate payment record for the requested order ID
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle()

  if (paymentError) {
    console.error("Error fetching payment for order:", paymentError)
    return new Response(JSON.stringify({ error: "Failed to locate payment record" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  if (!payment) {
    return new Response(JSON.stringify({ error: "No payment record found for this order" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  // 4. Retrieve latest payment proof belonging to this payment
  const { data: proof, error: proofError } = await supabase
    .from("payment_proofs")
    .select("storage_path, mime_type, original_filename")
    .eq("payment_id", payment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (proofError) {
    console.error("Error fetching payment proof metadata:", proofError)
    return new Response(JSON.stringify({ error: "Failed to locate payment proof metadata" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  if (!proof || !proof.storage_path) {
    return new Response(JSON.stringify({ error: "No payment proof uploaded for this order" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  // 5. Download object from private storage bucket using authenticated Supabase client (Storage RLS)
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("payment-proofs")
    .download(proof.storage_path)

  if (downloadError || !fileBlob) {
    console.error("Error downloading payment proof from storage:", downloadError)
    return new Response(JSON.stringify({ error: "Failed to retrieve payment proof file" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    })
  }

  // 6. Return streamed file with strict no-store cache headers
  const contentType = proof.mime_type || fileBlob.type || "application/octet-stream"
  const safeFilename = encodeURIComponent(proof.original_filename || "payment-proof")

  return new Response(fileBlob, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Content-Disposition": `inline; filename="${safeFilename}"`,
    },
  })
}
