import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { ProductDetails } from "@/components/product/product-details"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/pgp-login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { id } = await params

  // Get product with vendor info and category
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      vendors!inner(id, store_name, store_description),
      categories(name, slug)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <ProductDetails product={product} userId={user.id} />
      </main>
    </div>
  )
}
