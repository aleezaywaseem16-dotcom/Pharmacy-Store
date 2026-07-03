import { useEffect, useState, useCallback } from 'react';
import { Check, X, Trash2, Star } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

interface Review {
  id: string; rating: number; title?: string; body?: string;
  isApproved: boolean; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  product: { id: string; name: string; sku: string };
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all'|'pending'|'approved'>('pending');
  const [loading, setLoading] = useState(true);
  const [delTarget, setDelTarget] = useState<Review | null>(null);
  const toast = useToast();
  const limit = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const isApproved = filter === 'pending' ? 'false' : filter === 'approved' ? 'true' : undefined;
      const { data } = await api.get('/admin/reviews', { params: { page, limit, isApproved } });
      setReviews(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleApprove(id: string) {
    try {
      await api.patch(`/admin/reviews/${id}/approve`);
      toast.success('Review approved');
      fetch();
    } catch { toast.error('Failed'); }
  }

  async function handleReject(id: string) {
    try {
      await api.patch(`/admin/reviews/${id}/reject`);
      toast.success('Review rejected');
      fetch();
    } catch { toast.error('Failed'); }
  }

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await api.delete(`/admin/reviews/${delTarget.id}`);
      toast.success('Review deleted');
      setDelTarget(null);
      fetch();
    } catch { toast.error('Failed to delete'); }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Reviews</h1>
        <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
      </div>

      <div className="flex gap-2">
        {(['all','pending','approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div></div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No reviews found</div>
        ) : reviews.map(r => (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-medium text-white">{r.user.firstName} {r.user.lastName}</span>
                  <span className="text-xs text-gray-500">{r.user.email}</span>
                  <span className="text-xs text-gray-500">on</span>
                  <span className="text-xs text-emerald-400">{r.product.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                    ))}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${r.isApproved ? 'text-emerald-400 border-emerald-800 bg-emerald-900/30' : 'text-amber-400 border-amber-800 bg-amber-900/30'}`}>
                    {r.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                {r.title && <p className="text-sm font-medium text-white mb-1">{r.title}</p>}
                {r.body && <p className="text-sm text-gray-400">{r.body}</p>}
                <p className="text-xs text-gray-600 mt-2">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!r.isApproved && (
                  <button onClick={() => handleApprove(r.id)} title="Approve"
                    className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors">
                    <Check size={16} />
                  </button>
                )}
                {r.isApproved && (
                  <button onClick={() => handleReject(r.id)} title="Reject"
                    className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-gray-800 rounded transition-colors">
                    <X size={16} />
                  </button>
                )}
                <button onClick={() => setDelTarget(r)} title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} />

      <ConfirmDialog
        open={!!delTarget}
        title="Delete Review"
        message="This review will be permanently deleted."
        confirmLabel="Delete" danger
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
}
