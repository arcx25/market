import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { ProductForm } from "@/components/seller/product-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewProductPage() {
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

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">Add New Product</h1>
          <p className="mt-2 text-pretty text-muted-foreground">Create a new product listing for your store</p>
        </div>

        <ProductForm vendorId={vendor.id} categories={categories || []} />
      </main>
    </div>
  )
}
