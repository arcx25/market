import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { UpgradeFlow } from "@/components/upgrade/upgrade-flow"

export default async function UpgradePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/pgp-login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // If already a seller, redirect to dashboard
  if (profile?.role === "seller") {
    redirect("/seller/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <UpgradeFlow userId={user.id} />
      </main>
    </div>
  )
}
