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

    // Verify user is the seller for this order
    const { data: orderItem } = await supabase
      .from("order_items")
      .select("vendor_id, vendors!inner(user_id)")
      .eq("order_id", orderId)
      .single()

    if (!orderItem || orderItem.vendors.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update order status
    const { error } = await supabase
      .from("orders")
      .update({
        escrow_status: "shipped",
        status: "shipped",
      })
      .eq("id", orderId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Mark shipped error:", error)
    return NextResponse.json({ error: "Failed to mark as shipped" }, { status: 500 })
  }
}
