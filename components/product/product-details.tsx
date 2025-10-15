"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Store, Package, ShoppingCart, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface ProductDetailsProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    stock_quantity: number
    vendors: {
      id: string
      store_name: string
      store_description: string | null
    }
    categories: {
      name: string
      slug: string
    } | null
  }
  userId: string
}

export function ProductDetails({ product, userId }: ProductDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handlePurchase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          vendorId: product.vendors.id,
          quantity: 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order")
      }

      router.push(`/orders/${data.orderId}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create order")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/marketplace">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            {product.categories && (
              <Badge variant="secondary" className="mb-3">
                {product.categories.name}
              </Badge>
            )}
            <h1 className="text-balance text-4xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-4 text-3xl font-bold text-primary">${product.price} USD</p>
          </div>

          {product.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-pretty text-muted-foreground">{product.description}</p>
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{product.vendors.store_name}</p>
                  {product.vendors.store_description && (
                    <p className="mt-1 text-sm text-muted-foreground">{product.vendors.store_description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
            </span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={product.stock_quantity === 0 || isLoading}
            onClick={handlePurchase}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isLoading ? "Processing..." : product.stock_quantity === 0 ? "Out of Stock" : "Purchase with XMR"}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Payment will be held in escrow until you confirm delivery. Funds are released to the seller only after
              your confirmation.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
