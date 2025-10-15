import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { OrderDetails } from "@/components/orders/order-details"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/pgp-login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { id } = await params

  // Get order with items and product details
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items(
        *,
        products(name, image_url, description),
        vendors:vendor_id(store_name, store_description)
      )
    `,
    )
    .eq("id", id)
    .eq("buyer_id", user.id)
    .single()

  if (error || !order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <OrderDetails order={order} />
      </main>
    </div>
  )
}
