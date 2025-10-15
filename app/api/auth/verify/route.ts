import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { challengeId, decryptedMessage, email, password } = await request.json()
    const supabase = await createClient()

    // Verify challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("auth_challenges")
      .select("*, profiles!inner(email)")
      .eq("id", challengeId)
      .eq("used", false)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 400 })
    }

    // Check if challenge expired
    if (new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 })
    }

    // Verify decrypted message matches
    if (challenge.plain_message !== decryptedMessage) {
      return NextResponse.json({ error: "Invalid decrypted message" }, { status: 401 })
    }

    // Mark challenge as used
    await supabase.from("auth_challenges").update({ used: true }).eq("id", challengeId)

    // Sign in user with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError

    const cookieStore = await cookies()
    cookieStore.set("pgp-session", authData.session?.access_token || "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: authData.user,
    })
  } catch (error) {
    console.error("[v0] Verification error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 500 })
  }
}
