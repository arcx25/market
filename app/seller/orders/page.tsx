import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { SellerOrdersList } from "@/components/seller/seller-orders-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SellerOrdersPage() {
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

  const { data: vendor } = await supabase.from("vendors").select("*").eq("user_id", user.id).single()

  if (!vendor) {
    redirect("/marketplace")
  }

  // Get all orders for this seller
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      orders!inner(*),
      products(name, image_url),
      profiles:orders(buyer_id(full_name, email))
    `,
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-pretty text-muted-foreground">Manage your sales and shipments</p>
        </div>

        <SellerOrdersList orderItems={orderItems || []} />
      </main>
    </div>
  )
}
