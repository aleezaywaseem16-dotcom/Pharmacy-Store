import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(q);

  useEffect(() => {
    if (!q) { setProducts([]); setTotal(0); return; }
    setLoading(true);
    api.get(`/products?q=${encodeURIComponent(q)}&isActive=true&limit=24`)
      .then((r) => { setProducts(r.data.data ?? []); setTotal(r.data.pagination?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Search Medicines</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Search by name, generic name, SKU..."
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <button type="submit" className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
          <SearchIcon className="w-5 h-5" />
        </button>
      </form>

      {q && !loading && (
        <p className="text-sm text-slate-500 mb-4">
          {total} result{total !== 1 ? 's' : ''} for "<span className="font-semibold text-slate-800">{q}</span>"
        </p>
      )}

      {loading ? (
        <PageSpinner />
      ) : products.length === 0 && q ? (
        <EmptyState
          icon={SearchIcon}
          title="No results found"
          description={`We couldn't find anything for "${q}". Try a different search term.`}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
