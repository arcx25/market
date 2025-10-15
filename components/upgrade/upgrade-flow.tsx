"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Crown, Store, Copy, Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface UpgradeFlowProps {
  userId: string
}

export function UpgradeFlow({ userId }: UpgradeFlowProps) {
  const [step, setStep] = useState<"info" | "payment" | "pending">("info")
  const [storeName, setStoreName] = useState("")
  const [storeDescription, setStoreDescription] = useState("")
  const [xmrAddress, setXmrAddress] = useState("")
  const [xmrAmount, setXmrAmount] = useState(0)
  const [upgradeId, setUpgradeId] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirmed" | "failed">("pending")
  const router = useRouter()

  const copyAddress = () => {
    navigator.clipboard.writeText(xmrAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInitiateUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/upgrade/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeDescription }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate upgrade")
      }

      setXmrAddress(data.xmrAddress)
      setXmrAmount(data.xmrAmount)
      setUpgradeId(data.upgradeId)
      setStep("payment")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to initiate upgrade")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckPayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/upgrade/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upgradeId }),
      })

      const data = await response.json()

      if (data.status === "confirmed") {
        setPaymentStatus("confirmed")
        setTimeout(() => {
          router.push("/seller/dashboard")
        }, 2000)
      } else if (data.status === "pending") {
        setStep("pending")
      }
    } catch (error) {
      console.error("[v0] Payment check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for payment status when in pending state
  useEffect(() => {
    if (step === "pending") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/upgrade/check-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ upgradeId }),
          })

          const data = await response.json()

          if (data.status === "confirmed") {
            setPaymentStatus("confirmed")
            clearInterval(interval)
            setTimeout(() => {
              router.push("/seller/dashboard")
            }, 2000)
          }
        } catch (error) {
          console.error("[v0] Payment polling error:", error)
        }
      }, 10000) // Check every 10 seconds

      return () => clearInterval(interval)
    }
  }, [step, upgradeId, router])

  if (step === "info") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Crown className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight">Upgrade to Seller</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Start selling on our secure marketplace with full escrow protection
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Seller Benefits</CardTitle>
            <CardDescription>What you get with a seller account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3 rounded-lg border p-4">
                <Store className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Your Own Store</p>
                  <p className="text-sm text-muted-foreground">Create and manage your storefront</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Escrow Protection</p>
                  <p className="text-sm text-muted-foreground">Secure payment handling</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Unlimited Listings</p>
                  <p className="text-sm text-muted-foreground">List as many products as you want</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Analytics Dashboard</p>
                  <p className="text-sm text-muted-foreground">Track sales and performance</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 p-6 text-center">
              <p className="text-sm text-muted-foreground">One-time upgrade fee</p>
              <p className="mt-2 text-4xl font-bold">$1,000 USD</p>
              <p className="mt-1 text-sm text-muted-foreground">Payable in XMR (Monero)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Set up your store details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInitiateUpgrade} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  placeholder="My Awesome Store"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  placeholder="Tell buyers about your store..."
                  rows={4}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-5 w-5" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "payment") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Step 2 of 2
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight">Complete Payment</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Send XMR to the address below to complete your upgrade
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Amount to Send</Label>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-3xl font-bold">{xmrAmount.toFixed(8)} XMR</p>
                <p className="text-sm text-muted-foreground">≈ $1,000 USD</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Address</Label>
              <div className="flex gap-2">
                <code className="flex-1 overflow-hidden text-ellipsis rounded-lg bg-muted px-4 py-3 text-sm">
                  {xmrAddress}
                </code>
                <Button size="icon" variant="outline" onClick={copyAddress}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Send exactly {xmrAmount.toFixed(8)} XMR to the address above. Payment confirmation typically takes 10-20
                minutes.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={handleCheckPayment} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking Payment...
                  </>
                ) : (
                  "I've Sent the Payment"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Click the button above after sending payment to check status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "pending") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-2">
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            {paymentStatus === "confirmed" ? (
              <>
                <div className="mb-4 rounded-full bg-green-500/10 p-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Payment Confirmed!</h2>
                <p className="text-muted-foreground">Your account has been upgraded to seller status.</p>
                <p className="mt-4 text-sm text-muted-foreground">Redirecting to your dashboard...</p>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Waiting for Payment Confirmation</h2>
                <p className="text-muted-foreground">
                  We're monitoring the blockchain for your payment. This usually takes 10-20 minutes.
                </p>
                <div className="mt-6 rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Payment Address</p>
                  <code className="mt-2 block text-xs">{xmrAddress}</code>
                  <p className="mt-2 text-sm font-medium">Amount</p>
                  <p className="text-sm">{xmrAmount.toFixed(8)} XMR</p>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  You can safely close this page. We'll send you an email when your payment is confirmed.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
