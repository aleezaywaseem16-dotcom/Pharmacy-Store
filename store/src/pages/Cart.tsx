import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function Cart() {
  const { cart, loading, fetchCart, updateItem, removeItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Please login to view your cart</h2>
        <p className="text-slate-500 mb-6">Sign in to access your cart and checkout.</p>
        <Link to="/login" className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
          Login
        </Link>
      </div>
    );
  }

  if (loading) return <PageSpinner />;

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + (i.product.discountedPrice ?? i.product.price) * i.quantity, 0);
  const deliveryFee = subtotal >= 1500 ? 0 : 150;
  const total = subtotal + deliveryFee;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our shop and add medicines to your cart."
          action={{ label: 'Browse Shop', onClick: () => navigate('/shop') }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const price = item.product.discountedPrice ?? item.product.price;
              const img = item.product.images?.find((i) => i.isPrimary)?.storageKey
                ?? `https://placehold.co/100x100/e8f5e9/2e7d32?text=${encodeURIComponent(item.product.name.slice(0, 10))}`;

              return (
                <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-4">
                  <Link to={`/medicine/${item.product.slug}`}>
                    <img
                      src={img}
                      alt={item.product.name}
                      className="w-20 h-20 object-contain rounded-xl bg-slate-50 p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/100x100/e8f5e9/2e7d32?text=${encodeURIComponent(item.product.name.slice(0, 8))}`;
                      }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/medicine/${item.product.slug}`} className="font-semibold text-slate-800 text-sm hover:text-emerald-700 transition-colors line-clamp-2">
                      {item.product.name}
                    </Link>
                    {item.product.genericName && (
                      <p className="text-xs text-slate-400 mt-0.5">{item.product.genericName}</p>
                    )}
                    <p className="text-emerald-700 font-bold mt-1">Rs {price.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-800">Rs {(price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-4">
              <h3 className="font-bold text-slate-800 mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span>Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-medium' : ''}>
                    {deliveryFee === 0 ? 'Free' : `Rs ${deliveryFee}`}
                  </span>
                </div>
                {subtotal < 1500 && (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2">
                    Add Rs {(1500 - subtotal).toLocaleString()} more for free delivery
                  </p>
                )}
              </div>
              <div className="border-t border-slate-100 pt-3 mb-4 flex justify-between font-bold text-slate-800">
                <span>Total</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/shop" className="block text-center text-sm text-slate-500 hover:text-emerald-600 mt-3 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
