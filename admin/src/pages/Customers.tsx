import { useEffect, useState, useCallback } from 'react';
import { Search, Shield } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth.store';

interface User {
  id: string; email: string; firstName: string; lastName: string;
  phone?: string; role: string; isActive: boolean; isVerified: boolean;
  createdAt: string;
}

const ROLES = ['CUSTOMER','PHARMACIST','ADMIN','SUPER_ADMIN'];

export default function Customers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);
  const { isSuperAdmin } = useAuthStore();
  const toast = useToast();
  const limit = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page, limit, q: q || undefined } });
      setUsers(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleToggleStatus() {
    if (!statusTarget) return;
    setSaving(true);
    try {
      await api.patch(`/admin/users/${statusTarget.id}/status`, { isActive: !statusTarget.isActive });
      toast.success(`User ${statusTarget.isActive ? 'deactivated' : 'activated'}`);
      setStatusTarget(null);
      fetch();
    } catch { toast.error('Failed to update status'); }
    finally { setSaving(false); }
  }

  async function handleRoleChange() {
    if (!roleTarget) return;
    setSaving(true);
    try {
      await api.patch(`/admin/users/${roleTarget.id}/role`, { role: newRole });
      toast.success('Role updated');
      setRoleTarget(null);
      fetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed');
    }
    finally { setSaving(false); }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Customers</h1>
        <p className="text-sm text-gray-400 mt-0.5">{total} total users</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-72"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              {['Name','Email','Role','Status','Verified','Joined','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-500">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-900 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <span className="font-medium text-white">{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    u.role === 'SUPER_ADMIN' ? 'text-violet-400 border-violet-800 bg-violet-900/30' :
                    u.role === 'ADMIN' ? 'text-blue-400 border-blue-800 bg-blue-900/30' :
                    u.role === 'PHARMACIST' ? 'text-cyan-400 border-cyan-800 bg-cyan-900/30' :
                    'text-gray-300 border-gray-700 bg-gray-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.isVerified ? '✓ Yes' : '✗ No'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setStatusTarget(u)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${u.isActive ? 'text-red-400 hover:bg-red-900/20' : 'text-emerald-400 hover:bg-emerald-900/20'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {isSuperAdmin() && (
                      <button
                        onClick={() => { setRoleTarget(u); setNewRole(u.role); }}
                        className="text-xs px-2 py-1 rounded text-blue-400 hover:bg-blue-900/20 transition-colors flex items-center gap-1"
                      >
                        <Shield size={12} /> Role
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} />

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`${statusTarget?.isActive ? 'Deactivate' : 'Activate'} ${statusTarget?.firstName} ${statusTarget?.lastName}?`}
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        danger={statusTarget?.isActive}
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusTarget(null)}
      />

      <Modal open={!!roleTarget} title="Change User Role" onClose={() => setRoleTarget(null)}>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Changing role for <span className="text-white">{roleTarget?.firstName} {roleTarget?.lastName}</span></p>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">New Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setRoleTarget(null)} className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleRoleChange} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {saving ? 'Updating…' : 'Update Role'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
