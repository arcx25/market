"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Shield, Lock, Key, AlertCircle, Loader2 } from "lucide-react"

export default function PGPLoginPage() {
  const [step, setStep] = useState<"email" | "challenge">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [encryptedMessage, setEncryptedMessage] = useState("")
  const [decryptedMessage, setDecryptedMessage] = useState("")
  const [challengeId, setChallengeId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRequestChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate challenge")
      }

      setEncryptedMessage(data.encryptedMessage)
      setChallengeId(data.challengeId)
      setExpiresAt(data.expiresAt)
      setStep("challenge")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate challenge")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          decryptedMessage,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      router.push("/marketplace")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(encryptedMessage)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight">Secure Marketplace</h1>
          <p className="mt-2 text-pretty text-muted-foreground">PGP-authenticated decentralized trading platform</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">{step === "email" ? "Sign In" : "Decrypt Challenge"}</CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email to receive an encrypted challenge"
                : "Decrypt the message with your private key to authenticate"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleRequestChallenge}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      After submitting, you'll receive an encrypted challenge that only your private key can decrypt.
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Challenge...
                      </>
                    ) : (
                      "Request Challenge"
                    )}
                  </Button>
                </div>

                <div className="mt-6 text-center text-sm">
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="font-medium underline underline-offset-4">
                    Register
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyChallenge}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="encrypted" className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Encrypted Challenge
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={copyToClipboard}>
                        Copy
                      </Button>
                    </Label>
                    <Textarea id="encrypted" value={encryptedMessage} readOnly className="font-mono text-xs" rows={8} />
                    <p className="text-xs text-muted-foreground">Expires at: {new Date(expiresAt).toLocaleString()}</p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4 text-sm">
                    <p className="font-medium">How to decrypt:</p>
                    <ol className="ml-4 mt-2 list-decimal space-y-1 text-muted-foreground">
                      <li>Copy the encrypted message above</li>
                      <li>Use your PGP tool to decrypt it with your private key</li>
                      <li>Paste the decrypted message below</li>
                    </ol>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="decrypted">Decrypted Message</Label>
                    <Input
                      id="decrypted"
                      type="text"
                      placeholder="PGP_CHALLENGE_..."
                      required
                      value={decryptedMessage}
                      onChange={(e) => setDecryptedMessage(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep("email")} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Sign In"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
