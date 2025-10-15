import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptMessage, generateChallengeMessage } from "@/lib/pgp/utils"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const supabase = await createClient()

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, pgp_public_key, email")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!profile.pgp_public_key) {
      return NextResponse.json({ error: "User has no PGP key registered" }, { status: 400 })
    }

    // Generate challenge message
    const plainMessage = generateChallengeMessage()

    // Encrypt with user's public key
    const encryptedMessage = await encryptMessage(plainMessage, profile.pgp_public_key)

    // Store challenge in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    const { data: challenge, error: challengeError } = await supabase
      .from("auth_challenges")
      .insert({
        profile_id: profile.id,
        encrypted_message: encryptedMessage,
        plain_message: plainMessage,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (challengeError) throw challengeError

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      encryptedMessage,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Challenge generation error:", error)
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 })
  }
}
