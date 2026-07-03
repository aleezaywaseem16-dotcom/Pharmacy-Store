import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Package, DollarSign, Clock, AlertTriangle, ClipboardList } from 'lucide-react';
import api from '@/lib/api';
import { PageSpinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/Badge';

interface DashboardData {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    totalUsers: number;
    totalProducts: number;
    pendingPrescriptions: number;
    todayRevenue: number;
  };
  recentOrders: { id: string; orderNumber: string; status: string; total: number; user: { firstName: string; lastName: string }; createdAt: string }[];
  lowStockAlerts: { id: string; name: string; sku: string; totalStock: number }[];
}

function MetricCard({ icon: Icon, label, value, color, sub }: { icon: typeof DollarSign; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!data) return <div className="p-6 text-gray-400">Failed to load dashboard.</div>;

  const { metrics, recentOrders, lowStockAlerts } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Pharmacy management overview</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard icon={DollarSign} label="Today Revenue" value={`Rs ${Number(metrics.todayRevenue).toLocaleString()}`} color="bg-emerald-600" />
        <MetricCard icon={ShoppingCart} label="Total Orders" value={metrics.totalOrders} color="bg-blue-600" sub={`${metrics.pendingOrders} pending`} />
        <MetricCard icon={Users} label="Customers" value={metrics.totalUsers} color="bg-violet-600" />
        <MetricCard icon={Package} label="Products" value={metrics.totalProducts} color="bg-orange-600" />
        <MetricCard icon={Clock} label="Pending Orders" value={metrics.pendingOrders} color="bg-amber-600" />
        <MetricCard icon={ClipboardList} label="Prescriptions" value={metrics.pendingPrescriptions} color="bg-pink-600" sub="pending review" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-emerald-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentOrders.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No orders yet.</p>
            )}
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">#{o.orderNumber}</p>
                  <p className="text-xs text-gray-400 truncate">{o.user.firstName} {o.user.lastName}</p>
                </div>
                <StatusBadge status={o.status} />
                <p className="text-sm font-medium text-white">Rs {Number(o.total).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Low Stock
            </h2>
            <Link to="/inventory" className="text-xs text-emerald-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-800">
            {lowStockAlerts.length === 0 && (
              <p className="p-4 text-sm text-gray-500">All items sufficiently stocked.</p>
            )}
            {lowStockAlerts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.sku}</p>
                </div>
                <span className={`text-sm font-bold ${p.totalStock === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {p.totalStock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Add Product', to: '/products/new' },
            { label: 'Add Category', to: '/categories' },
            { label: 'Add Coupon', to: '/coupons' },
            { label: 'View Reports', to: '/reports' },
            { label: 'Manage Inventory', to: '/inventory' },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
