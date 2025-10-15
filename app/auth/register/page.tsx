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
import { Shield, Key, AlertCircle } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, publicKey, fullName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      router.push("/auth/register-success")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Register with your PGP public key for secure authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

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
                  <p className="text-xs text-muted-foreground">Used for account recovery and session management</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="publicKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    PGP Public Key
                  </Label>
                  <Textarea
                    id="publicKey"
                    placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
                    required
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    className="font-mono text-sm"
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your public key will be used to encrypt authentication challenges
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Keep your private key secure. You'll need it to decrypt login challenges. Never share your private
                    key with anyone.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>

              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/pgp-login" className="font-medium underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            Don't have a PGP key?{" "}
            <a
              href="https://www.openpgp.org/software/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Generate one here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
