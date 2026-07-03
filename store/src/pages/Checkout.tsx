import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, CreditCard, Tag, CheckCircle, Plus } from 'lucide-react';
import api, { showError } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { Address } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery', icon: '💵' },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
  { value: 'DEBIT_CARD', label: 'Debit Card', icon: '🏦' },
  { value: 'JAZZCASH', label: 'JazzCash', icon: '📱' },
  { value: 'EASYPAISA', label: 'Easypaisa', icon: '📲' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏛️' },
];

export default function Checkout() {
  const { cart, fetchCart, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', streetLine1: '', city: '', state: '', postalCode: '', country: 'PK', isDefault: false });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([fetchCart(), api.get('/auth/me/addresses')])
      .then(([, r]) => {
        const addrs: Address[] = r.data.data ?? [];
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) setSelectedAddress(def.id);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + (i.product.discountedPrice ?? i.product.price) * i.quantity, 0);
  const delivery = subtotal >= 1500 ? 0 : 150;
  const total = subtotal + delivery;

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/me/addresses', newAddr);
      setAddresses((prev) => [...prev, data.data]);
      setSelectedAddress(data.data.id);
      setShowAddAddress(false);
      toast.success('Address added');
    } catch (e) { showError(e); }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        addressId: selectedAddress,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await clearCart();
      navigate(`/orders/${data.data.id}`, { state: { success: true } });
      toast.success('Order placed successfully!');
    } catch (e) { showError(e); }
    finally { setPlacing(false); }
  };

  if (loading) return <PageSpinner />;
  if (items.length === 0) return (
    <div className="text-center py-20">
      <p className="text-slate-500 mb-4">Your cart is empty.</p>
      <Link to="/shop" className="text-emerald-600 underline">Browse Shop</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Delivery Address */}
          <Section title="Delivery Address" icon={<MapPin className="w-5 h-5 text-emerald-600" />}>
            {addresses.length === 0 ? (
              <p className="text-sm text-slate-500 mb-3">No saved addresses. Add one below.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                    <input type="radio" name="addr" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-0.5 accent-emerald-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-slate-800">{addr.label} {addr.isDefault && <span className="text-xs text-emerald-600">(Default)</span>}</p>
                      <p className="text-slate-500">{addr.streetLine1}{addr.streetLine2 ? `, ${addr.streetLine2}` : ''}</p>
                      <p className="text-slate-500">{addr.city}, {addr.state} {addr.postalCode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium hover:text-emerald-700">
              <Plus className="w-4 h-4" /> Add new address
            </button>

            {showAddAddress && (
              <form onSubmit={addAddress} className="mt-3 space-y-2 bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Label" value={newAddr.label} onChange={(v) => setNewAddr((a) => ({ ...a, label: v }))} placeholder="Home, Office..." />
                  <Field label="Street Address" value={newAddr.streetLine1} onChange={(v) => setNewAddr((a) => ({ ...a, streetLine1: v }))} placeholder="Street, Building" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="City" value={newAddr.city} onChange={(v) => setNewAddr((a) => ({ ...a, city: v }))} placeholder="Karachi" />
                  <Field label="State/Province" value={newAddr.state} onChange={(v) => setNewAddr((a) => ({ ...a, state: v }))} placeholder="Sindh" />
                  <Field label="Postal Code" value={newAddr.postalCode} onChange={(v) => setNewAddr((a) => ({ ...a, postalCode: v }))} placeholder="75400" />
                </div>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                  Save Address
                </button>
              </form>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment Method" icon={<CreditCard className="w-5 h-5 text-emerald-600" />}>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === m.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                  <input type="radio" name="pay" checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} className="accent-emerald-600" />
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-sm font-medium text-slate-800">{m.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Coupon */}
          <Section title="Coupon Code" icon={<Tag className="w-5 h-5 text-emerald-600" />}>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 uppercase"
              />
              <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
                Apply
              </button>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Order Notes (Optional)" icon={null}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for your order..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 resize-none"
            />
          </Section>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-4">
            <h3 className="font-bold text-slate-800 mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">{item.product.name} x{item.quantity}</span>
                  <span className="text-slate-800 font-medium flex-shrink-0">
                    Rs {((item.product.discountedPrice ?? item.product.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className={delivery === 0 ? 'text-emerald-600 font-medium' : ''}>{delivery === 0 ? 'Free' : `Rs ${delivery}`}</span>
              </div>
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between font-bold text-slate-800 mb-4">
              <span>Total</span><span>Rs {total.toLocaleString()}</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing || !selectedAddress}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              <CheckCircle className="w-5 h-5" />
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-slate-600 mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-emerald-400"
      />
    </div>
  );
}
