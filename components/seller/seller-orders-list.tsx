"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  created_at: string
  order_id: string
  orders: {
    id: string
    buyer_id: string
    escrow_status: string
    xmr_amount: number | null
    buyer_confirmed_at: string | null
  }
  products: {
    name: string
    image_url: string | null
  }
  profiles: {
    full_name: string
    email: string
  }
}

interface SellerOrdersListProps {
  orderItems: OrderItem[]
}

export function SellerOrdersList({ orderItems }: SellerOrdersListProps) {
  const router = useRouter()
  const [shippingId, setShippingId] = useState<string | null>(null)

  const handleMarkShipped = async (orderId: string) => {
    setShippingId(orderId)
    try {
      const response = await fetch("/api/seller/orders/mark-shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Mark shipped error:", error)
    } finally {
      setShippingId(null)
    }
  }

  const handleMarkDelivered = async (orderId: string) => {
    setShippingId(orderId)
    try {
      const response = await fetch("/api/seller/orders/mark-delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Mark delivered error:", error)
    } finally {
      setShippingId(null)
    }
  }

  if (orderItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No orders yet</h3>
          <p className="text-sm text-muted-foreground">Orders will appear here when customers make purchases</p>
        </CardContent>
      </Card>
    )
  }

  // Group order items by order_id
  const groupedOrders = orderItems.reduce(
    (acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = {
          order: item.orders,
          buyer: item.profiles,
          items: [],
        }
      }
      acc[item.order_id].items.push(item)
      return acc
    },
    {} as Record<string, { order: OrderItem["orders"]; buyer: OrderItem["profiles"]; items: OrderItem[] }>,
  )

  return (
    <div className="space-y-4">
      {Object.entries(groupedOrders).map(([orderId, { order, buyer, items }]) => {
        const totalAmount = items.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0)

        return (
          <Card key={orderId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{orderId.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    From: {buyer.full_name} ({buyer.email})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Placed on {new Date(items[0].created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={
                    order.escrow_status === "completed"
                      ? "default"
                      : order.escrow_status === "pending"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {order.escrow_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {item.products.image_url ? (
                      <Image
                        src={item.products.image_url || "/placeholder.svg"}
                        alt={item.products.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium">{item.products.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ${item.price_at_purchase}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm">
                  <p className="font-medium">Total Amount</p>
                  {order.xmr_amount && <p className="text-muted-foreground">{order.xmr_amount.toFixed(8)} XMR</p>}
                </div>
                <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>

              {order.escrow_status === "paid" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleMarkShipped(orderId)}
                    disabled={shippingId === orderId}
                  >
                    {shippingId === orderId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Mark as Shipped"
                    )}
                  </Button>
                </div>
              )}

              {order.escrow_status === "shipped" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleMarkDelivered(orderId)}
                    disabled={shippingId === orderId}
                  >
                    {shippingId === orderId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Mark as Delivered"
                    )}
                  </Button>
                </div>
              )}

              {order.escrow_status === "delivered" && !order.buyer_confirmed_at && (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium">Awaiting buyer confirmation</p>
                  <p className="text-muted-foreground">Funds will be released once the buyer confirms delivery</p>
                </div>
              )}

              {order.buyer_confirmed_at && (
                <div className="rounded-lg bg-green-500/10 p-4 text-sm">
                  <p className="font-medium text-green-700 dark:text-green-400">Payment Released</p>
                  <p className="text-muted-foreground">
                    Buyer confirmed delivery on {new Date(order.buyer_confirmed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
