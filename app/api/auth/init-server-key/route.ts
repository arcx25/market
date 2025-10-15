import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateKeyPair } from "@/lib/pgp/utils"
import { getServerKey } from "@/lib/pgp/server-key"

export async function POST() {
  try {
    const existingKey = await getServerKey()

    if (existingKey) {
      return NextResponse.json({
        success: true,
        message: "Server key already configured",
        publicKey: existingKey.publicKey,
        fingerprint: existingKey.fingerprint,
      })
    }

    const supabase = await createClient()
    const keyPair = await generateKeyPair(
      "Marketplace Server",
      "server@marketplace.local",
      process.env.SERVER_PGP_PASSPHRASE,
    )

    // Store in database
    const { error } = await supabase.from("server_keys").insert({
      public_key: keyPair.publicKey,
      private_key_encrypted: keyPair.privateKey,
      fingerprint: keyPair.fingerprint,
      is_active: true,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      publicKey: keyPair.publicKey,
      fingerprint: keyPair.fingerprint,
    })
  } catch (error) {
    console.error("[v0] Error initializing server key:", error)
    return NextResponse.json({ error: "Failed to initialize server key" }, { status: 500 })
  }
}
