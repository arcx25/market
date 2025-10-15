import * as openpgp from "openpgp"

export interface PGPKeyPair {
  publicKey: string
  privateKey: string
  fingerprint: string
}

/**
 * Generate a new PGP key pair
 */
export async function generateKeyPair(name: string, email: string, passphrase?: string): Promise<PGPKeyPair> {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "rsa",
    rsaBits: 4096,
    userIDs: [{ name, email }],
    passphrase,
  })

  const key = await openpgp.readKey({ armoredKey: publicKey })
  const fingerprint = key.getFingerprint()

  return {
    publicKey,
    privateKey,
    fingerprint,
  }
}

/**
 * Encrypt a message with a public key
 */
export async function encryptMessage(message: string, publicKeyArmored: string): Promise<string> {
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored })

  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: message }),
    encryptionKeys: publicKey,
  })

  return encrypted as string
}

/**
 * Decrypt a message with a private key
 */
export async function decryptMessage(
  encryptedMessage: string,
  privateKeyArmored: string,
  passphrase?: string,
): Promise<string> {
  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
    passphrase,
  })

  const message = await openpgp.readMessage({
    armoredMessage: encryptedMessage,
  })

  const { data: decrypted } = await openpgp.decrypt({
    message,
    decryptionKeys: privateKey,
  })

  return decrypted as string
}

/**
 * Get fingerprint from a public key
 */
export async function getFingerprint(publicKeyArmored: string): Promise<string> {
  const key = await openpgp.readKey({ armoredKey: publicKeyArmored })
  return key.getFingerprint()
}

/**
 * Validate a PGP public key
 */
export async function validatePublicKey(publicKeyArmored: string): Promise<boolean> {
  try {
    const key = await openpgp.readKey({ armoredKey: publicKeyArmored })
    return !key.isPrivate()
  } catch {
    return false
  }
}

/**
 * Generate a random challenge message
 */
export function generateChallengeMessage(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `PGP_CHALLENGE_${timestamp}_${random}`
}
