import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, CheckCircle, Truck, MapPin, Clock, XCircle } from 'lucide-react';
import api, { showError } from '@/lib/api';
import { Order, OrderStatus, PAYMENT_METHOD_LABELS, toNum } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

const STEPS: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: 'PENDING',          label: 'Order Placed',      icon: Package },
  { status: 'CONFIRMED',        label: 'Confirmed',         icon: CheckCircle },
  { status: 'PROCESSING',       label: 'Processing',        icon: Clock },
  { status: 'PACKED',           label: 'Packed',            icon: Package },
  { status: 'SHIPPED',          label: 'Shipped',           icon: Truck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',  icon: Truck },
  { status: 'DELIVERED',        label: 'Delivered',         icon: MapPin },
];

const STATUS_ORDER: OrderStatus[] = ['PENDING','CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED'];

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get('id') ?? '';
  const [input, setInput] = useState(orderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const search = async (id: string) => {
    if (!id.trim()) return;
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${id.trim()}`);
      setOrder(data.data);
    } catch (e) { showError(e); setOrder(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (orderId) search(orderId); }, [orderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ id: input.trim() });
  };

  const currentStep = order ? STATUS_ORDER.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED' || order?.status === 'RETURNED';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Track Your Order</h1>
      <p className="text-slate-500 text-sm mb-6">Enter your order ID to track the status of your delivery.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter Order ID (UUID)"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <button type="submit" className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </form>

      {loading && <PageSpinner />}

      {!loading && order && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500">Order Number</p>
              <p className="font-bold text-slate-800 text-lg">{order.orderNumber}</p>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <Badge variant={isCancelled ? 'red' : order.status === 'DELIVERED' ? 'green' : 'blue'}>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Timeline */}
          {!isCancelled ? (
            <div className="relative mb-6">
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
              <div className="space-y-4">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex items-center gap-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0 transition-all ${done ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-100'}`}>
                        <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                        {active && <p className="text-xs text-emerald-600 font-medium">Current status</p>}
                      </div>
                      {active && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Order Cancelled</p>
                {order.cancellationReason && <p className="text-sm text-red-600 mt-0.5">Reason: {order.cancellationReason}</p>}
              </div>
            </div>
          )}

          {/* Order details */}
          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Delivery Address</p>
              {order.address && (
                <p className="text-slate-800 font-medium">{order.address.streetLine1}, {order.address.city}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500 mb-1">Payment</p>
              <p className="text-slate-800 font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Items</p>
              <p className="text-slate-800 font-medium">{order.items?.length ?? 0} item(s)</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Total Amount</p>
              <p className="text-emerald-700 font-bold">Rs {toNum(order.total).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Link to={`/orders/${order.id}`} className="text-sm text-emerald-600 hover:underline font-medium">
              View Full Details →
            </Link>
            <Link to="/orders" className="text-sm text-slate-500 hover:text-slate-700">
              All Orders
            </Link>
          </div>
        </div>
      )}

      {!loading && !order && orderId && (
        <div className="text-center py-12 text-slate-500">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>No order found with this ID.</p>
          <Link to="/orders" className="text-emerald-600 text-sm mt-2 block">View your orders →</Link>
        </div>
      )}
    </div>
  );
}
