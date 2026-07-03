import { Heart, ShoppingCart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';
import StarRating from './StarRating';
import Badge from './ui/Badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props { product: Product }

function getImageUrl(product: Product): string {
  const primary = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  if (primary?.storageKey) return primary.storageKey;
  return `https://placehold.co/400x300/e8f5e9/2e7d32?text=${encodeURIComponent(product.name.slice(0, 20))}`;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const inWishlist = has(product.id);
  const effectivePrice = product.discountedPrice ?? product.price;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100)
    : 0;
  const inStock = product.totalStock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    if (product.requiresPrescription) { toast.error('Prescription required – upload one first'); return; }
    addItem(product.id);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggle(product);
    toast.success(has(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link to={`/medicine/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 card-hover h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden bg-slate-50 aspect-[4/3]">
          <img
            src={getImageUrl(product)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/400x300/e8f5e9/2e7d32?text=${encodeURIComponent(product.name.slice(0, 15))}`;
            }}
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>
          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'text-red-500 fill-red-500' : 'text-slate-500'}`} />
          </button>
          {/* Prescription badge */}
          {product.requiresPrescription && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Rx
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {product.category && (
            <p className="text-xs text-emerald-600 font-medium mb-1">{product.category.name}</p>
          )}
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
          {product.genericName && (
            <p className="text-xs text-slate-400 mb-2">{product.genericName}</p>
          )}
          <StarRating rating={product.averageRating} count={product.reviewCount} />

          <div className="mt-auto pt-3 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-slate-800">
                Rs {effectivePrice.toLocaleString()}
              </p>
              {hasDiscount && (
                <p className="text-xs text-slate-400 line-through">
                  Rs {product.price.toLocaleString()}
                </p>
              )}
            </div>
            {inStock ? (
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            ) : (
              <Badge variant="red">Out of Stock</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
