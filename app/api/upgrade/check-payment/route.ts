import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { upgradeId } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get upgrade request
    const { data: upgrade, error: upgradeError } = await supabase
      .from("upgrade_requests")
      .select("*")
      .eq("id", upgradeId)
      .eq("user_id", user.id)
      .single()

    if (upgradeError || !upgrade) {
      return NextResponse.json({ error: "Upgrade request not found" }, { status: 404 })
    }

    // Check payment status using Monero RPC
    const paymentConfirmed = await checkMoneroPayment(upgrade.xmr_address, upgrade.xmr_amount)

    if (paymentConfirmed && upgrade.status === "pending") {
      // Update upgrade request status
      await supabase.from("upgrade_requests").update({ status: "confirmed" }).eq("id", upgradeId)

      // Update user profile to seller
      await supabase
        .from("profiles")
        .update({
          role: "seller",
          upgraded_to_seller_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      // Create vendor record
      const storeSlug = upgrade.store_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      await supabase.from("vendors").insert({
        user_id: user.id,
        store_name: upgrade.store_name,
        store_description: upgrade.store_description,
        store_slug: storeSlug,
      })

      return NextResponse.json({ status: "confirmed" })
    }

    return NextResponse.json({ status: upgrade.status })
  } catch (error) {
    console.error("[v0] Payment check error:", error)
    return NextResponse.json({ error: "Failed to check payment" }, { status: 500 })
  }
}

// Placeholder function - will be replaced with actual Monero RPC integration
async function checkMoneroPayment(address: string, expectedAmount: number): Promise<boolean> {
  // In production, this would:
  // 1. Connect to Monero RPC
  // 2. Check incoming transfers to the address
  // 3. Verify amount and confirmations
  // For now, return false (payment not confirmed)
  console.log("[v0] Checking payment for address:", address, "amount:", expectedAmount)
  return false
}
