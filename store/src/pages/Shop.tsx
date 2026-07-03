import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { Product, Category, PaginatedResponse } from '@/types';
import ProductCard from '@/components/ProductCard';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { ShoppingBag } from 'lucide-react';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get('page') ?? 1);
  const categoryId = searchParams.get('categoryId') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';
  const isFeatured = searchParams.get('isFeatured') ?? '';
  const requiresPrescription = searchParams.get('requiresPrescription') ?? '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      params.set('isActive', 'true');
      if (categoryId) params.set('categoryId', categoryId);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);
      if (isFeatured) params.set('isFeatured', isFeatured);
      if (requiresPrescription) params.set('requiresPrescription', requiresPrescription);

      const { data } = await api.get<PaginatedResponse<Product>>(`/products?${params}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, minPrice, maxPrice, sortBy, sortOrder, isFeatured, requiresPrescription]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data ?? []));
  }, []);

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      if (value) n.set(key, value); else n.delete(key);
      n.delete('page');
      return n;
    });
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = categoryId || minPrice || maxPrice || isFeatured || requiresPrescription;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medicine Shop</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? '...' : `${pagination.total} products found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:border-emerald-400 transition-colors md:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`
          ${filtersOpen ? 'block' : 'hidden'} md:block
          fixed md:static inset-0 z-40 md:z-auto bg-white md:bg-transparent
          w-72 md:w-64 flex-shrink-0 overflow-y-auto md:overflow-visible
          p-4 md:p-0 shadow-xl md:shadow-none
        `}>
          <div className="md:sticky md:top-4 space-y-4">
            <div className="flex items-center justify-between md:hidden mb-4">
              <h3 className="font-semibold text-slate-800">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            {/* Category */}
            <FilterSection title="Category">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cat" checked={!categoryId} onChange={() => setParam('categoryId', '')} className="accent-emerald-600" />
                  <span className="text-sm text-slate-700">All</span>
                </label>
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="cat" checked={categoryId === c.id} onChange={() => setParam('categoryId', c.id)} className="accent-emerald-600" />
                    <span className="text-sm text-slate-700">{c.name}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price Range (Rs)">
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-emerald-400"
                />
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-emerald-400"
                />
              </div>
            </FilterSection>

            {/* Sort */}
            <FilterSection title="Sort By">
              <div className="space-y-1.5">
                {[
                  { v: 'createdAt-desc', l: 'Newest First' },
                  { v: 'price-asc', l: 'Price: Low to High' },
                  { v: 'price-desc', l: 'Price: High to Low' },
                  { v: 'averageRating-desc', l: 'Top Rated' },
                ].map(({ v, l }) => {
                  const [sb, so] = v.split('-');
                  const active = sortBy === sb && sortOrder === so;
                  return (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sort" checked={active}
                        onChange={() => { setParam('sortBy', sb); setParam('sortOrder', so); }}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm text-slate-700">{l}</span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Filters */}
            <FilterSection title="Filters">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFeatured === 'true'} onChange={(e) => setParam('isFeatured', e.target.checked ? 'true' : '')} className="accent-emerald-600" />
                  <span className="text-sm text-slate-700">Featured Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={requiresPrescription === 'false'} onChange={(e) => setParam('requiresPrescription', e.target.checked ? 'false' : '')} className="accent-emerald-600" />
                  <span className="text-sm text-slate-700">OTC (No Prescription)</span>
                </label>
              </div>
            </FilterSection>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {filtersOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setFiltersOpen(false)} />
        )}

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <PageSpinner />
          ) : products.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No products found"
              description="Try adjusting your filters or search terms"
              action={{ label: 'Clear Filters', onClick: clearFilters }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:border-emerald-400 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setParam('page', String(p))}
                      className={`w-9 h-9 text-sm rounded-lg border transition-colors ${page === p ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:border-emerald-400'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:border-emerald-400 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 font-semibold text-sm text-slate-800 hover:bg-slate-50 transition-colors">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
