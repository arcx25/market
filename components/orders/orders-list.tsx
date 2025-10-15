import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Order {
  id: string
  total_amount: number
  status: string
  escrow_status: string
  xmr_payment_address: string | null
  xmr_amount: number | null
  created_at: string
  order_items: Array<{
    quantity: number
    price_at_purchase: number
    products: {
      name: string
      image_url: string | null
    }
    vendors: {
      store_name: string
    }
  }>
}

interface OrdersListProps {
  orders: Order[]
}

function getEscrowStatusBadge(status: string) {
  const statusConfig = {
    pending: { label: "Awaiting Payment", variant: "secondary" as const, icon: Clock },
    paid: { label: "Payment Received", variant: "default" as const, icon: CheckCircle2 },
    shipped: { label: "Shipped", variant: "default" as const, icon: Package },
    delivered: { label: "Delivered", variant: "default" as const, icon: Package },
    completed: { label: "Completed", variant: "default" as const, icon: CheckCircle2 },
    disputed: { label: "Disputed", variant: "destructive" as const, icon: AlertCircle },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No orders yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Start shopping to see your orders here</p>
          <Button asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              {getEscrowStatusBadge(order.escrow_status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex gap-4">
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
                  <p className="text-sm text-muted-foreground">Seller: {item.vendors.store_name}</p>
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
              <p className="text-xl font-bold">${order.total_amount.toFixed(2)}</p>
            </div>

            <Button asChild className="w-full">
              <Link href={`/orders/${order.id}`}>View Order Details</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
