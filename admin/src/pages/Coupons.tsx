import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface Coupon {
  id: string; code: string; type: string; value: number;
  minOrderAmount?: number; maxDiscount?: number; usageLimit?: number;
  usageCount: number; validFrom: string; validUntil: string; isActive: boolean;
  _count?: { orders: number };
}

function toLocal(dt: string) {
  return dt ? new Date(dt).toISOString().slice(0,16) : '';
}

const EMPTY = { code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '', isActive: true };

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [delTarget, setDelTarget] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const limit = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/coupons', { params: { page, limit, q: q || undefined } });
      setCoupons(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { fetch(); }, [fetch]);

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: String(c.value), minOrderAmount: String(c.minOrderAmount ?? ''), maxDiscount: String(c.maxDiscount ?? ''), usageLimit: String(c.usageLimit ?? ''), validFrom: toLocal(c.validFrom), validUntil: toLocal(c.validUntil), isActive: c.isActive });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
      };
      if (editing) {
        await api.patch(`/admin/coupons/${editing.id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created');
      }
      setShowModal(false);
      fetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await api.delete(`/admin/coupons/${delTarget.id}`);
      toast.success('Coupon deleted');
      setDelTarget(null);
      fetch();
    } catch { toast.error('Failed to delete'); }
  }

  const isExpired = (c: Coupon) => new Date(c.validUntil) < new Date();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Coupons</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by code…"
          className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-64" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              {['Code','Type','Value','Min Order','Usage','Valid Until','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-500">No coupons found</td></tr>
            ) : coupons.map(c => (
              <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-emerald-400">{c.code}</td>
                <td className="px-4 py-3 text-gray-300">{c.type}</td>
                <td className="px-4 py-3 text-white">
                  {c.type === 'PERCENTAGE' ? `${c.value}%` : `Rs ${Number(c.value).toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {c.minOrderAmount ? `Rs ${Number(c.minOrderAmount).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {c.usageCount}/{c.usageLimit ?? '∞'}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={isExpired(c) ? 'text-red-400' : 'text-gray-300'}>
                    {new Date(c.validUntil).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    isExpired(c) ? 'text-red-400 border-red-800 bg-red-900/30' :
                    c.isActive ? 'text-emerald-400 border-emerald-800 bg-emerald-900/30' :
                    'text-gray-400 border-gray-700 bg-gray-800'
                  }`}>
                    {isExpired(c) ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => setDelTarget(c)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} />

      <Modal open={showModal} title={editing ? 'Edit Coupon' : 'Add Coupon'} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Value * {form.type === 'PERCENTAGE' ? '(%)' : '(Rs)'}</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Min Order Amount (Rs)</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Max Discount (Rs)</label>
              <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                placeholder="Unlimited" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Valid From *</label>
              <input type="datetime-local" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Valid Until *</label>
              <input type="datetime-local" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm text-gray-300">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        title="Delete Coupon"
        message={`Delete coupon "${delTarget?.code}"?`}
        confirmLabel="Delete" danger
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
}
