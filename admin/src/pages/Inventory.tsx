import { useEffect, useState, useCallback } from 'react';
import { Plus, AlertTriangle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface Batch {
  id: string; batchNumber: string; quantity: number; reservedQty: number;
  expiryDate: string; purchasePrice: number; isActive: boolean;
  product: { id: string; name: string; sku: string };
}

interface LowStock { id: string; name: string; sku: string; totalStock: number; }
interface Product { id: string; name: string; sku: string; }

const BATCH_EMPTY = { productId: '', batchNumber: '', quantity: '', purchasePrice: '', expiryDate: '' };
const ADJUST_EMPTY = { batchId: '', type: 'CORRECTION', quantity: '', reason: '' };
const ADJUST_TYPES = ['PURCHASE','SALE','RETURN','DAMAGE','EXPIRY_REMOVAL','CORRECTION','RECALL'];

export default function Inventory() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [expiring, setExpiring] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [batchForm, setBatchForm] = useState(BATCH_EMPTY);
  const [adjustForm, setAdjustForm] = useState(ADJUST_EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'all'|'low'|'expiring'>('all');
  const toast = useToast();
  const limit = 15;

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/inventory', { params: { page, limit } });
      setBatches(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  useEffect(() => {
    api.get('/admin/inventory/low-stock').then(r => setLowStock(r.data.data ?? []));
    api.get('/admin/inventory/expiring-soon', { params: { days: 30 } }).then(r => setExpiring(r.data.data ?? []));
    api.get('/admin/products', { params: { limit: 200 } }).then(r => setProducts(r.data.data ?? []));
  }, []);

  async function handleCreateBatch() {
    setSaving(true);
    try {
      await api.post('/admin/inventory/batches', { ...batchForm, quantity: Number(batchForm.quantity), purchasePrice: Number(batchForm.purchasePrice) });
      toast.success('Batch created');
      setShowBatchModal(false);
      setBatchForm(BATCH_EMPTY);
      fetchBatches();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  }

  async function handleAdjust() {
    setSaving(true);
    try {
      await api.post('/admin/inventory/adjust', { ...adjustForm, quantity: Number(adjustForm.quantity) });
      toast.success('Stock adjusted');
      setShowAdjustModal(false);
      setAdjustForm(ADJUST_EMPTY);
      fetchBatches();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} batches</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdjustModal(true)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Adjust Stock
          </button>
          <button onClick={() => setShowBatchModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Add Batch
          </button>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border cursor-pointer transition-colors ${tab === 'low' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-800 hover:border-amber-700/50'}`}
          onClick={() => setTab(tab === 'low' ? 'all' : 'low')}>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-white">{lowStock.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Products below threshold</p>
        </div>
        <div className={`p-4 rounded-xl border cursor-pointer transition-colors ${tab === 'expiring' ? 'bg-red-900/30 border-red-700' : 'bg-gray-900 border-gray-800 hover:border-red-700/50'}`}
          onClick={() => setTab(tab === 'expiring' ? 'all' : 'expiring')}>
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <Clock size={16} />
            <span className="text-sm font-medium">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-white">{expiring.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Within 30 days</p>
        </div>
      </div>

      {/* Low Stock List */}
      {tab === 'low' && (
        <div className="bg-gray-900 border border-amber-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-amber-400 text-sm">Low Stock Products</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Product</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">SKU</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Stock</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800">
              {lowStock.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-white">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-bold text-amber-400">{p.totalStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiring List */}
      {tab === 'expiring' && (
        <div className="bg-gray-900 border border-red-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-red-400 text-sm">Expiring Within 30 Days</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Product</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Batch</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Qty</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Expires</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800">
              {expiring.map(b => (
                <tr key={b.id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-white">{b.product?.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{b.batchNumber}</td>
                  <td className="px-4 py-3 text-white">{b.quantity}</td>
                  <td className="px-4 py-3 text-red-400">{new Date(b.expiryDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Batches */}
      {tab === 'all' && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {['Product','Batch #','Qty','Reserved','Expiry','Purchase Price','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></td></tr>
                ) : batches.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-500">No batches found</td></tr>
                ) : batches.map(b => (
                  <tr key={b.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3">
                      <p className="text-white">{b.product?.name}</p>
                      <p className="text-xs text-gray-500">{b.product?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">{b.batchNumber}</td>
                    <td className="px-4 py-3 text-white">{b.quantity}</td>
                    <td className="px-4 py-3 text-gray-400">{b.reservedQty}</td>
                    <td className="px-4 py-3">
                      <span className={new Date(b.expiryDate) < new Date(Date.now() + 30*24*60*60*1000) ? 'text-red-400' : 'text-gray-300'}>
                        {new Date(b.expiryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">Rs {Number(b.purchasePrice).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${b.isActive ? 'text-emerald-400 border-emerald-800 bg-emerald-900/30' : 'text-gray-400 border-gray-700 bg-gray-800'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} />
        </>
      )}

      {/* Add Batch Modal */}
      <Modal open={showBatchModal} title="Add Inventory Batch" onClose={() => setShowBatchModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Product *</label>
            <select value={batchForm.productId} onChange={e => setBatchForm(f => ({ ...f, productId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          {[['batchNumber','Batch Number','text'],['quantity','Quantity','number'],['purchasePrice','Purchase Price (Rs)','number'],['expiryDate','Expiry Date','date']].map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{label} *</label>
              <input type={type} value={(batchForm as Record<string,string>)[key]}
                onChange={e => setBatchForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowBatchModal(false)} className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleCreateBatch} disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Batch'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal open={showAdjustModal} title="Adjust Stock" onClose={() => setShowAdjustModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Batch *</label>
            <select value={adjustForm.batchId} onChange={e => setAdjustForm(f => ({ ...f, batchId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.product?.name} — {b.batchNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Type *</label>
            <select value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              {ADJUST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Quantity *</label>
            <input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Reason *</label>
            <input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAdjustModal(false)} className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleAdjust} disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {saving ? 'Adjusting…' : 'Apply Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
