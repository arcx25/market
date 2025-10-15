import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { ProductsTable } from "@/components/seller/products-table"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SellerProductsPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight">Products</h1>
            <p className="mt-2 text-pretty text-muted-foreground">Manage your product listings</p>
          </div>
          <Button asChild size="lg">
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Link>
          </Button>
        </div>

        <ProductsTable products={products || []} vendorId={vendor.id} />
      </main>
    </div>
  )
}
