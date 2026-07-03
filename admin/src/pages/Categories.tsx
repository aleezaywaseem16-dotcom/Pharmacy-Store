import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface Category {
  id: string; name: string; slug: string; isActive: boolean; sortOrder: number;
  parent?: { id: string; name: string };
  _count?: { products: number };
}

const EMPTY = { name: '', description: '', sortOrder: '0', isActive: true, parentId: '' };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [delTarget, setDelTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const limit = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/categories', { params: { page, limit, q: q || undefined } });
      setCategories(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { fetch(); }, [fetch]);

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, description: '', sortOrder: String(c.sortOrder), isActive: c.isActive, parentId: c.parent?.id ?? '' });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder), parentId: form.parentId || undefined };
      if (editing) {
        await api.patch(`/admin/categories/${editing.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created');
      }
      setShowModal(false);
      fetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await api.delete(`/admin/categories/${delTarget.id}`);
      toast.success('Category deleted');
      setDelTarget(null);
      fetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to delete');
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search categories…"
          className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Slug</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Parent</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Products</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Order</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-500">No categories found</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{c.slug}</td>
                <td className="px-4 py-3 text-gray-400">{c.parent?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300">{c._count?.products ?? 0}</td>
                <td className="px-4 py-3 text-gray-300">{c.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.isActive ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
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

      <Modal open={showModal} title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Parent Category</label>
            <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">None (top-level)</option>
              {categories.filter(c => c.id !== editing?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
            <span className="text-sm text-gray-300">Active</span>
          </label>
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
        title="Delete Category"
        message={`Delete "${delTarget?.name}"? Products in this category may be affected.`}
        confirmLabel="Delete" danger
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
}
