import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, CheckCircle, XCircle, MapPin } from 'lucide-react';
import api, { showError } from '@/lib/api';
import { Order, OrderStatus, PAYMENT_METHOD_LABELS, toNum } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { toast } from 'sonner';

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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const justPlaced = location.state?.success;

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    api.get(`/orders/${id}`)
      .then((r) => setOrder(r.data.data))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const cancelOrder = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    setCancelling(true);
    try {
      await api.patch(`/orders/${id}/cancel`, { reason: cancelReason });
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);
      setShowCancel(false);
      toast.success('Order cancelled');
    } catch (e) { showError(e); }
    finally { setCancelling(false); }
  };

  if (loading) return <PageSpinner />;
  if (!order) return <div className="text-center py-20 text-slate-500">Order not found.</div>;

  const status = STATUS_MAP[order.status] ?? { label: order.status, color: 'gray' as const };
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
  const subtotal = toNum(order.subtotal);
  const shipping = toNum(order.shippingFee);
  const discount = toNum(order.discountAmount);
  const tax = toNum(order.taxAmount);
  const total = toNum(order.total);
  const payLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {justPlaced && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Order placed successfully!</p>
            <p className="text-sm text-emerald-600">We'll notify you when it's confirmed and shipped.</p>
          </div>
        </div>
      )}

      <Link to="/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{order.orderNumber}</p>
              <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <Badge variant={status.color}>{status.label}</Badge>
        </div>

        {/* Items */}
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-800">{item.productName || item.product?.name}</p>
                  <p className="text-slate-500 text-xs">Qty: {item.quantity} × Rs {toNum(item.unitPrice).toLocaleString()}</p>
                </div>
                <p className="font-semibold text-slate-800">Rs {toNum(item.subtotal).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Financials */}
        <div className="p-5 border-b border-slate-100">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
            {shipping > 0 && (
              <div className="flex justify-between text-slate-600"><span>Shipping</span><span>Rs {shipping.toLocaleString()}</span></div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-slate-600"><span>Tax</span><span>Rs {tax.toLocaleString()}</span></div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−Rs {discount.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-2 mt-1">
              <span>Total</span><span>Rs {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Payment Method</p>
            <p className="font-medium text-slate-800">{payLabel}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Payment Status</p>
            <p className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {order.paymentStatus}
            </p>
          </div>
          {order.address && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Delivery Address</p>
              <p className="font-medium text-slate-800">
                {order.address.streetLine1}{order.address.streetLine2 ? `, ${order.address.streetLine2}` : ''}, {order.address.city}, {order.address.state} {order.address.postalCode}
              </p>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-1">Notes</p>
              <p className="text-slate-700">{order.notes}</p>
            </div>
          )}
          {order.coupon && (
            <div>
              <p className="text-slate-500 mb-1">Coupon Used</p>
              <p className="font-medium text-emerald-700">{order.coupon.code}</p>
            </div>
          )}
          {order.cancellationReason && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-1">Cancellation Reason</p>
              <p className="text-red-600">{order.cancellationReason}</p>
            </div>
          )}
        </div>

        {/* Cancel */}
        {canCancel && (
          <div className="p-5 border-t border-slate-100">
            {!showCancel ? (
              <button
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Cancel this order?</p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  rows={2}
                  className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm outline-none mb-3 resize-none bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={cancelOrder}
                    disabled={cancelling}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                  <button onClick={() => setShowCancel(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors">
                    Keep Order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
