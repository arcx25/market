import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update order to mark delivery as confirmed
    const { error } = await supabase
      .from("orders")
      .update({
        escrow_status: "completed",
        buyer_confirmed_at: new Date().toISOString(),
        seller_paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("buyer_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Confirm delivery error:", error)
    return NextResponse.json({ error: "Failed to confirm delivery" }, { status: 500 })
  }
}
