import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/api';
import { PageSpinner } from '@/components/ui/Spinner';

type Period = 'week' | 'month' | 'year';

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

interface OrderData {
  byStatus: { status: string; _count: number }[];
  byPayment: { paymentMethod: string; _count: number }[];
  topProducts: { productName: string; _sum: { quantity: number; subtotal: number } }[];
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>('month');
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [orders, setOrders] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/reports/revenue', { params: { period } }),
      api.get('/admin/reports/orders', { params: { period } }),
    ]).then(([r, o]) => {
      setRevenue(r.data.data);
      setOrders(o.data.data);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Analytics overview</p>
        </div>
        <div className="flex gap-2">
          {(['week','month','year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${period === p ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {revenue && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `Rs ${Number(revenue.totalRevenue).toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Total Orders', value: revenue.totalOrders, color: 'text-blue-400' },
              { label: 'Paid Orders', value: revenue.paidOrders, color: 'text-green-400' },
              { label: 'Pending Payment', value: revenue.pendingOrders, color: 'text-amber-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Revenue Over Time</h2>
            {revenue.revenueByDay.length === 0 ? (
              <p className="text-gray-500 text-sm">No data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenue.revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `Rs${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      {orders && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Orders by Status</h2>
            {orders.byStatus.length === 0 ? (
              <p className="text-gray-500 text-sm">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={orders.byStatus} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="status" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="_count" fill="#10b981" radius={[4,4,0,0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Top Products (by qty sold)</h2>
            <div className="space-y-2">
              {orders.topProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">No data.</p>
              ) : orders.topProducts.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 bg-emerald-900/50 text-emerald-400 rounded text-xs flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <span className="text-sm text-gray-300 truncate">{p.productName}</span>
                  </div>
                  <div className="flex gap-4 flex-shrink-0 text-xs">
                    <span className="text-gray-400">{p._sum.quantity} units</span>
                    <span className="text-emerald-400 font-medium">Rs {Number(p._sum.subtotal).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Orders by Payment Method</h2>
            {orders.byPayment.length === 0 ? (
              <p className="text-gray-500 text-sm">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orders.byPayment} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis type="category" dataKey="paymentMethod" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="_count" fill="#6366f1" radius={[0,4,4,0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
