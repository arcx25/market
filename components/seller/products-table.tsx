"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock_quantity: number
  is_active: boolean
  categories: {
    name: string
  } | null
}

interface ProductsTableProps {
  products: Product[]
  vendorId: string
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    setDeletingId(productId)
    try {
      const response = await fetch("/api/seller/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
    } finally {
      setDeletingId(null)
    }
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first product to start selling</p>
          <Button asChild>
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {product.image_url ? (
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {product.categories && <Badge variant="outline">{product.categories.name}</Badge>}
                      <span className="text-sm text-muted-foreground">{product.stock_quantity} in stock</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">${product.price}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/seller/products/${product.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingId === product.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
