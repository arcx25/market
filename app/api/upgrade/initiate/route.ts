import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { storeName, storeDescription } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is already a seller
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role === "seller") {
      return NextResponse.json({ error: "Already a seller" }, { status: 400 })
    }

    // Generate XMR payment address using Monero RPC
    // For now, using placeholder - will be replaced with actual Monero RPC call
    const xmrAddress = await generateXMRAddress()
    const xmrAmount = await convertUSDToXMR(1000) // $1000 USD

    // Create upgrade request record
    const { data: upgrade, error: upgradeError } = await supabase
      .from("upgrade_requests")
      .insert({
        user_id: user.id,
        store_name: storeName,
        store_description: storeDescription,
        xmr_address: xmrAddress,
        xmr_amount: xmrAmount,
        status: "pending",
      })
      .select()
      .single()

    if (upgradeError) throw upgradeError

    return NextResponse.json({
      success: true,
      upgradeId: upgrade.id,
      xmrAddress,
      xmrAmount,
    })
  } catch (error) {
    console.error("[v0] Upgrade initiation error:", error)
    return NextResponse.json({ error: "Failed to initiate upgrade" }, { status: 500 })
  }
}

// Placeholder function - will be replaced with actual Monero RPC integration
async function generateXMRAddress(): Promise<string> {
  // In production, this would call Monero RPC to generate a new subaddress
  // For now, return a placeholder address
  return `4${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

// Placeholder function - will be replaced with actual price conversion
async function convertUSDToXMR(usdAmount: number): Promise<number> {
  // In production, this would fetch current XMR/USD rate from an API
  // For now, using a placeholder rate of $100/XMR
  const xmrRate = 100
  return usdAmount / xmrRate
}
