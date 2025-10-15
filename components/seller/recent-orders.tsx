import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface Order {
  id: string
  quantity: number
  price_at_purchase: number
  created_at: string
  orders: {
    escrow_status: string
  }
  products: {
    name: string
  }
}

interface RecentOrdersProps {
  orders: Order[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center text-center">
          <Package className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex-1">
                <p className="font-medium">{order.products.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.quantity} × ${order.price_at_purchase} = $
                  {(order.quantity * order.price_at_purchase).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <Badge variant={order.orders.escrow_status === "completed" ? "default" : "secondary"}>
                {order.orders.escrow_status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
