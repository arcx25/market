import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ShoppingCart, Store } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock_quantity: number
  vendors: {
    store_name: string
  }
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No products found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
          <CardHeader className="p-0">
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              {product.image_url ? (
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-balance font-semibold leading-tight">{product.name}</h3>
              <Badge variant="secondary" className="shrink-0">
                ${product.price}
              </Badge>
            </div>

            {product.description && (
              <p className="mb-3 line-clamp-2 text-pretty text-sm text-muted-foreground">{product.description}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store className="h-3 w-3" />
              <span>{product.vendors.store_name}</span>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">{product.stock_quantity} in stock</div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Button asChild className="w-full">
              <Link href={`/product/${product.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
