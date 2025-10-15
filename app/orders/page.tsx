import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { OrdersList } from "@/components/orders/orders-list"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/pgp-login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's orders with order items and product details
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items(
        *,
        products(name, image_url),
        vendors:vendor_id(store_name)
      )
    `,
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">My Orders</h1>
          <p className="mt-2 text-pretty text-muted-foreground">Track your purchases and manage escrow payments</p>
        </div>

        <OrdersList orders={orders || []} />
      </main>
    </div>
  )
}
