import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { productId, vendorId, quantity } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("price, stock_quantity, name")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })
    }

    const totalAmount = product.price * quantity

    // Generate XMR payment address (placeholder - will be replaced with actual Monero RPC)
    const xmrAddress = `4${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    const xmrAmount = totalAmount / 100 // Placeholder conversion rate

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        status: "pending",
        xmr_payment_address: xmrAddress,
        xmr_amount: xmrAmount,
        escrow_status: "pending",
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order item
    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: productId,
      vendor_id: vendorId,
      quantity,
      price_at_purchase: product.price,
    })

    if (itemError) throw itemError

    return NextResponse.json({
      success: true,
      orderId: order.id,
      xmrAddress,
      xmrAmount,
    })
  } catch (error) {
    console.error("[v0] Order creation error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
