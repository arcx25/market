import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns this product
    const { data: product } = await supabase
      .from("products")
      .select("vendor_id, vendors!inner(user_id)")
      .eq("id", productId)
      .single()

    if (!product || product.vendors.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Product deletion error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
