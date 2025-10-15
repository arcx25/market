import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { productId, vendorId, name, description, price, imageUrl, stockQuantity, categoryId, isActive } =
      await request.json()
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

    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update({
        name,
        description,
        price,
        image_url: imageUrl || null,
        stock_quantity: stockQuantity,
        category_id: categoryId,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error("[v0] Product update error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}
