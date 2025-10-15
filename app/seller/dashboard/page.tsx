import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { SellerStats } from "@/components/seller/seller-stats"
import { RecentOrders } from "@/components/seller/recent-orders"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/pgp-login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "seller") {
    redirect("/marketplace")
  }

  // Get vendor info
  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).single()

  if (!vendor) {
    redirect("/marketplace")
  }

  // Get seller statistics
  const { data: products } = await supabase.from("products").select("*").eq("vendor_id", vendor.id)

  const { data: orders } = await supabase
    .from("order_items")
    .select("*, orders!inner(*), products(name)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const totalProducts = products?.length || 0
  const activeProducts = products?.filter((p) => p.is_active).length || 0
  const totalOrders = orders?.length || 0
  const totalRevenue =
    orders?.reduce((sum, item) => {
      return sum + (item.orders.escrow_status === "completed" ? item.price_at_purchase * item.quantity : 0)
    }, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight">Seller Dashboard</h1>
            <p className="mt-2 text-pretty text-muted-foreground">{vendor.store_name}</p>
          </div>
          <Button asChild size="lg">
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Link>
          </Button>
        </div>

        <SellerStats
          totalProducts={totalProducts}
          activeProducts={activeProducts}
          totalOrders={totalOrders}
          totalRevenue={totalRevenue}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <RecentOrders orders={orders || []} />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
            </div>
            <div className="grid gap-4">
              <Button asChild variant="outline" size="lg" className="justify-start bg-transparent">
                <Link href="/seller/products">Manage Products</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="justify-start bg-transparent">
                <Link href="/seller/orders">View All Orders</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="justify-start bg-transparent">
                <Link href="/seller/settings">Store Settings</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
