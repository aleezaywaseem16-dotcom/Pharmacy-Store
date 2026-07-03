import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Edit2, Star } from 'lucide-react';
import api, { showError } from '@/lib/api';
import { Address } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

const BLANK: Omit<Address, 'id'> = { label: 'Home', streetLine1: '', streetLine2: '', city: '', state: '', postalCode: '', country: 'PK', isDefault: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>(BLANK);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    load();
  }, [isAuthenticated]);

  const load = () => {
    api.get('/auth/me/addresses')
      .then((r) => setAddresses(r.data.data ?? []))
      .finally(() => setLoading(false));
  };

  const openNew = () => { setEditing(null); setForm(BLANK); setShowForm(true); };
  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({ label: a.label, streetLine1: a.streetLine1, streetLine2: a.streetLine2 ?? '', city: a.city, state: a.state, postalCode: a.postalCode, country: a.country, isDefault: a.isDefault });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.patch(`/auth/me/addresses/${editing.id}`, form);
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? data.data : a));
        toast.success('Address updated');
      } else {
        const { data } = await api.post('/auth/me/addresses', form);
        setAddresses((prev) => [...prev, data.data]);
        toast.success('Address added');
      }
      setShowForm(false);
    } catch (e) { showError(e); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/auth/me/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteId(null);
      toast.success('Address deleted');
    } catch (e) { showError(e); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Addresses</h1>
          <p className="text-slate-500 text-sm mt-1">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-emerald-200 p-5 mb-5 animate-fade-in">
          <h3 className="font-semibold text-slate-800 mb-4">{editing ? 'Edit Address' : 'New Address'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Label" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="Home, Office..." required />
            <Field label="Street Line 1" value={form.streetLine1} onChange={(v) => setForm((f) => ({ ...f, streetLine1: v }))} placeholder="House / Street" required />
          </div>
          <div className="mb-3">
            <Field label="Street Line 2 (Optional)" value={form.streetLine2 ?? ''} onChange={(v) => setForm((f) => ({ ...f, streetLine2: v }))} placeholder="Apartment, Floor..." />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="Karachi" required />
            <Field label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} placeholder="Sindh" required />
            <Field label="Postal Code" value={form.postalCode} onChange={(v) => setForm((f) => ({ ...f, postalCode: v }))} placeholder="75400" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-4 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="accent-emerald-600" />
            Set as default address
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : editing ? 'Update' : 'Save Address'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm rounded-xl hover:bg-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses saved" description="Add a delivery address to speed up checkout." action={{ label: 'Add Address', onClick: openNew }} />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-white rounded-2xl border transition-all ${addr.isDefault ? 'border-emerald-300 shadow-sm' : 'border-slate-100'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{addr.label}</p>
                        {addr.isDefault && (
                          <span className="flex items-center gap-0.5 text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{addr.streetLine1}{addr.streetLine2 ? `, ${addr.streetLine2}` : ''}</p>
                      <p className="text-sm text-slate-500">{addr.city}, {addr.state} {addr.postalCode}, {addr.country}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(addr)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" aria-label="Edit address">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(addr.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" aria-label="Delete address">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {confirmDeleteId === addr.id && (
                <div className="px-5 pb-4 border-t border-red-100 pt-3 bg-red-50 rounded-b-2xl">
                  <p className="text-sm font-medium text-red-800 mb-2">Delete this address?</p>
                  <div className="flex gap-2">
                    <button onClick={() => del(addr.id)} className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-1.5 bg-white text-slate-600 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs text-slate-600 mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-emerald-400 transition-colors" />
    </div>
  );
}
