"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, User, LogOut, Store, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/database"

interface MarketplaceHeaderProps {
  profile: Profile | null
}

export function MarketplaceHeader({ profile }: MarketplaceHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/pgp-login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/marketplace" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold">SecureMarket</span>
        </Link>

        <div className="flex items-center gap-4">
          {profile?.role === "buyer" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/upgrade">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Seller
              </Link>
            </Button>
          )}

          {profile?.role === "seller" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/seller/dashboard">
                <Store className="mr-2 h-4 w-4" />
                Seller Dashboard
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <p className="text-xs font-medium text-primary">
                    {profile?.role === "seller" ? "Seller Account" : "Buyer Account"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/orders">My Orders</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
