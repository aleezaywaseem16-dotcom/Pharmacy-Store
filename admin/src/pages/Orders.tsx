import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';

interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  total: number; createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const limit = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', { params: { page, limit, q: q || undefined, status: status || undefined } });
      setOrders(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, q, status]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      toast.success('Status updated');
      fetch();
    } catch { toast.error('Failed to update status'); }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Order # or customer…"
            className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>
        <select
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Order #</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Payment</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Total</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-500">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/orders/${o.id}`} className="font-medium text-emerald-400 hover:underline">#{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white">{o.user.firstName} {o.user.lastName}</p>
                  <p className="text-xs text-gray-500">{o.user.email}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-3 font-medium text-white">Rs {Number(o.total).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="relative group">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none pr-6"
                    >
                      {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} />
    </div>
  );
}
