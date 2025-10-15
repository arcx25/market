import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = await createClient()

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete("pgp-session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
