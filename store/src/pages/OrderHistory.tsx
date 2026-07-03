import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Clock } from 'lucide-react';
import api from '@/lib/api';
import { Order, OrderStatus, PAYMENT_METHOD_LABELS, toNum } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';

const STATUS_MAP: Record<OrderStatus, { label: string; color: 'green' | 'yellow' | 'blue' | 'red' | 'gray' | 'orange' }> = {
  PENDING:          { label: 'Pending',          color: 'yellow' },
  CONFIRMED:        { label: 'Confirmed',         color: 'blue' },
  PROCESSING:       { label: 'Processing',        color: 'blue' },
  PACKED:           { label: 'Packed',            color: 'blue' },
  SHIPPED:          { label: 'Shipped',           color: 'orange' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'orange' },
  DELIVERED:        { label: 'Delivered',         color: 'green' },
  CANCELLED:        { label: 'Cancelled',         color: 'red' },
  RETURNED:         { label: 'Returned',          color: 'gray' },
  REFUNDED:         { label: 'Refunded',          color: 'gray' },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    api.get('/orders')
      .then((r) => setOrders(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order History</h1>
          <p className="text-slate-500 text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
        <Link to="/track" className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Track an Order →</Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place orders, they'll show up here."
          action={{ label: 'Start Shopping', onClick: () => navigate('/shop') }}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] ?? { label: order.status, color: 'gray' as const };
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={status.color}>{status.label}</Badge>
                    <p className="font-bold text-slate-800 mt-1">Rs {toNum(order.total).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                    {' · '}
                    {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod}
                  </p>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
