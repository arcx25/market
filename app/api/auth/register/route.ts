import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validatePublicKey, getFingerprint } from "@/lib/pgp/utils"

export async function POST(request: Request) {
  try {
    const { email, password, publicKey, fullName } = await request.json()

    // Validate PGP public key
    const isValid = await validatePublicKey(publicKey)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid PGP public key" }, { status: 400 })
    }

    const fingerprint = await getFingerprint(publicKey)
    const supabase = await createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          pgp_public_key: publicKey,
          pgp_fingerprint: fingerprint,
        },
      },
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error("User creation failed")
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email to confirm your account.",
      userId: authData.user.id,
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed" }, { status: 500 })
  }
}
