import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface Product {
  id: string; name: string; sku: string; price: number; discountedPrice?: number;
  totalStock: number; isActive: boolean; requiresPrescription: boolean;
  category?: { name: string }; averageRating: number; reviewCount: number;
}

interface Category { id: string; name: string; }

const EMPTY = { name: '', sku: '', price: '', discountedPrice: '', categoryId: '', genericName: '', description: '', dosageForm: '', strength: '', packSize: '', requiresPrescription: false, isActive: true, isFeatured: false };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [delTarget, setDelTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const limit = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/products', { params: { page, limit, q: q || undefined } });
      setProducts(data.data);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/admin/categories', { params: { limit: 100 } })
      .then(r => setCategories(r.data.data ?? []));
  }, []);

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ ...EMPTY, name: p.name, sku: p.sku, price: String(p.price), discountedPrice: String(p.discountedPrice ?? ''), categoryId: '', genericName: '', description: '', dosageForm: '', strength: '', packSize: '', requiresPrescription: p.requiresPrescription, isActive: p.isActive, isFeatured: false });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined };
      if (editing) {
        await api.patch(`/admin/products/${editing.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save';
      toast.error(msg);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await api.delete(`/admin/products/${delTarget.id}`);
      toast.success('Product deleted');
      setDelTarget(null);
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search products…"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">SKU</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Category</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Price</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Stock</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-500">No products found</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{p.name}</p>
                    {p.requiresPrescription && <span className="text-xs text-amber-400">Rx Required</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 text-gray-300">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {p.discountedPrice ? (
                    <div>
                      <p className="text-white">Rs {Number(p.discountedPrice).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 line-through">Rs {Number(p.price).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-white">Rs {Number(p.price).toLocaleString()}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={p.totalStock === 0 ? 'text-red-400 font-bold' : p.totalStock <= 10 ? 'text-amber-400 font-bold' : 'text-white'}>
                    {p.totalStock}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => setDelTarget(p)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} />

      {/* Product Modal */}
      <Modal open={showModal} title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)} width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {([['name','Name','text',true],['sku','SKU (auto if blank)','text',false],['genericName','Generic Name','text',false]] as const).map(([key, label, type, req]) => (
              <div key={key} className={key === 'name' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                <input type={type} required={req} value={(form as Record<string, unknown>)[key] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Price (Rs)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Discounted Price</label>
              <input type="number" step="0.01" value={form.discountedPrice} onChange={e => setForm(f => ({ ...f, discountedPrice: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="">Select…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Dosage Form</label>
              <input value={form.dosageForm} onChange={e => setForm(f => ({ ...f, dosageForm: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Strength</label>
              <input value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Pack Size</label>
              <input value={form.packSize} onChange={e => setForm(f => ({ ...f, packSize: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
            <div className="flex items-center gap-6 col-span-2">
              {([['requiresPrescription','Requires Prescription'],['isActive','Active'],['isFeatured','Featured']] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form as Record<string, unknown>)[key] as boolean}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
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
        title="Delete Product"
        message={`Delete "${delTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
}
