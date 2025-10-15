import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { CategoryFilter } from "@/components/marketplace/category-filter"
import { ProductGrid } from "@/components/marketplace/product-grid"
import { SearchBar } from "@/components/marketplace/search-bar"

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/pgp-login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get categories
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  const params = await searchParams
  const selectedCategory = params.category
  const searchQuery = params.search

  // Build products query
  let productsQuery = supabase
    .from("products")
    .select("*, vendors!inner(store_name)")
    .eq("is_active", true)
    .gt("stock_quantity", 0)

  if (selectedCategory) {
    productsQuery = productsQuery.eq("category_id", selectedCategory)
  }

  if (searchQuery) {
    productsQuery = productsQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data: products } = await productsQuery.order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">Marketplace</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Browse products from verified sellers in our secure marketplace
          </p>
        </div>

        <div className="mb-6">
          <SearchBar initialSearch={searchQuery} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <CategoryFilter categories={categories || []} selectedCategory={selectedCategory} />
          </aside>

          <div>
            <ProductGrid products={products || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
