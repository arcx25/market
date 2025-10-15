"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Clock, CheckCircle2, AlertCircle, Copy, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface OrderDetailsProps {
  order: {
    id: string
    total_amount: number
    status: string
    escrow_status: string
    xmr_payment_address: string | null
    xmr_amount: number | null
    buyer_confirmed_at: string | null
    created_at: string
    order_items: Array<{
      quantity: number
      price_at_purchase: number
      products: {
        name: string
        image_url: string | null
        description: string | null
      }
      vendors: {
        store_name: string
        store_description: string | null
      }
    }>
  }
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [copied, setCopied] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()

  const copyAddress = () => {
    if (order.xmr_payment_address) {
      navigator.clipboard.writeText(order.xmr_payment_address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmDelivery = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch("/api/orders/confirm-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error confirming delivery:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />
      case "paid":
      case "shipped":
      case "delivered":
        return <Package className="h-5 w-5" />
      case "completed":
        return <CheckCircle2 className="h-5 w-5" />
      case "disputed":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  {getStatusIcon(order.escrow_status)}
                  {order.escrow_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {item.products.image_url ? (
                      <Image
                        src={item.products.image_url || "/placeholder.svg"}
                        alt={item.products.name}
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
                    <h4 className="font-semibold">{item.products.name}</h4>
                    {item.products.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.products.description}</p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">Seller: {item.vendors.store_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ${item.price_at_purchase}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold">${order.total_amount.toFixed(2)}</p>
                {order.xmr_amount && <p className="text-sm text-muted-foreground">{order.xmr_amount.toFixed(8)} XMR</p>}
              </div>

              {order.xmr_payment_address && order.escrow_status === "pending" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">XMR Payment Address</p>
                  <div className="flex gap-2">
                    <code className="flex-1 overflow-hidden text-ellipsis rounded bg-muted px-3 py-2 text-xs">
                      {order.xmr_payment_address}
                    </code>
                    <Button size="icon" variant="outline" onClick={copyAddress}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {order.escrow_status === "pending" && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Send exactly {order.xmr_amount?.toFixed(8)} XMR to the address above. Funds will be held in escrow.
                  </AlertDescription>
                </Alert>
              )}

              {order.escrow_status === "delivered" && !order.buyer_confirmed_at && (
                <div className="space-y-3">
                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      The seller has marked this order as delivered. Please confirm receipt to release funds from
                      escrow.
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" onClick={handleConfirmDelivery} disabled={isConfirming}>
                    {isConfirming ? "Confirming..." : "Confirm Delivery"}
                  </Button>
                </div>
              )}

              {order.buyer_confirmed_at && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Delivery confirmed on {new Date(order.buyer_confirmed_at).toLocaleDateString()}. Funds released to
                    seller.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Order Placed</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {order.escrow_status !== "pending" && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Payment Received</p>
                      <p className="text-xs text-muted-foreground">Funds held in escrow</p>
                    </div>
                  </div>
                )}

                {(order.escrow_status === "shipped" ||
                  order.escrow_status === "delivered" ||
                  order.escrow_status === "completed") && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Shipped</p>
                      <p className="text-xs text-muted-foreground">In transit</p>
                    </div>
                  </div>
                )}

                {order.buyer_confirmed_at && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Delivery Confirmed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.buyer_confirmed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
