import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { vendorId, name, description, price, imageUrl, stockQuantity, categoryId, isActive } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a seller and owns this vendor
    const { data: vendor } = await supabase.from("vendors").select("user_id").eq("id", vendorId).single()

    if (!vendor || vendor.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        vendor_id: vendorId,
        name,
        description,
        price,
        image_url: imageUrl || null,
        stock_quantity: stockQuantity,
        category_id: categoryId,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("[v0] Product creation error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
