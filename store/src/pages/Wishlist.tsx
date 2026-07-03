import { useNavigate } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist.store';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/EmptyState';

export default function Wishlist() {
  const { items, remove, clear } = useWishlistStore();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Wishlist</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save medicines you love to your wishlist and they'll appear here."
          action={{ label: 'Browse Shop', onClick: () => navigate('/shop') }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />
              <button
                onClick={() => remove(product.id)}
                className="absolute top-3 left-3 w-7 h-7 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow border border-slate-100 transition-colors z-10"
                title="Remove from wishlist"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
