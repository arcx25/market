import * as openpgp from "openpgp"
import { createClient } from "@/lib/supabase/server"

/**
 * Get the server's PGP key pair
 * First checks environment variable, then falls back to database
 */
export async function getServerKey(): Promise<{
  publicKey: string
  privateKey: string
  fingerprint: string
} | null> {
  const envPrivateKey = process.env.SERVER_PGP_PRIVATE_KEY

  if (envPrivateKey) {
    try {
      // Read the private key
      const privateKey = await openpgp.readPrivateKey({
        armoredKey: envPrivateKey,
      })

      // Extract public key from private key
      const publicKey = privateKey.toPublic().armor()
      const fingerprint = privateKey.getFingerprint()

      return {
        publicKey,
        privateKey: envPrivateKey,
        fingerprint,
      }
    } catch (error) {
      console.error("[v0] Error reading SERVER_PGP_PRIVATE_KEY:", error)
      // Fall through to database lookup
    }
  }

  try {
    const supabase = await createClient()
    const { data: serverKey } = await supabase
      .from("server_keys")
      .select("public_key, private_key_encrypted, fingerprint")
      .eq("is_active", true)
      .single()

    if (serverKey) {
      return {
        publicKey: serverKey.public_key,
        privateKey: serverKey.private_key_encrypted,
        fingerprint: serverKey.fingerprint,
      }
    }
  } catch (error) {
    console.error("[v0] Error fetching server key from database:", error)
  }

  return null
}

/**
 * Decrypt the server's private key with passphrase
 */
export async function decryptServerKey(privateKeyArmored: string): Promise<openpgp.PrivateKey> {
  const passphrase = process.env.SERVER_PGP_PASSPHRASE

  const privateKey = await openpgp.readPrivateKey({
    armoredKey: privateKeyArmored,
  })

  if (passphrase && privateKey.isEncrypted()) {
    return await openpgp.decryptKey({
      privateKey,
      passphrase,
    })
  }

  return privateKey
}
