import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, AlertCircle, ChevronRight, Star, Shield,
  Package, Thermometer, Info, MessageSquare, Send
} from 'lucide-react';
import api, { showError } from '@/lib/api';
import { Product, Review } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import StarRating from '@/components/StarRating';
import Badge from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function MedicineDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'dosage'>('details');
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((r) => {
        setProduct(r.data.data);
        return api.get(`/reviews/products/${r.data.data.id}`);
      })
      .then((r) => setReviews(r.data.data ?? []))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageSpinner />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Product not found.</p>
      <Link to="/shop" className="text-emerald-600 underline mt-2 block">Back to shop</Link>
    </div>
  );

  const images = product.images?.length > 0
    ? product.images
    : [{ storageKey: `https://placehold.co/600x500/e8f5e9/2e7d32?text=${encodeURIComponent(product.name)}`, isPrimary: true, id: '0', sortOrder: 0 }];

  const effectivePrice = product.discountedPrice ?? product.price;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const inStock = product.totalStock > 0;
  const inWishlist = has(product.id);

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    if (product.requiresPrescription) { toast.error('Prescription required — upload one first'); return; }
    for (let i = 0; i < qty; i++) addItem(product.id);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (reviewForm.rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/reviews/products/${product.id}`, reviewForm);
      setReviews((prev) => [data.data, ...prev]);
      setReviewForm({ rating: 0, title: '', body: '' });
      toast.success('Review submitted successfully');
    } catch (e) { showError(e); }
    finally { setSubmitting(false); }
  };

  const tabs = [
    { id: 'details', label: 'Product Details' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    { id: 'dosage', label: 'Dosage & Safety' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-emerald-600">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/shop" className="hover:text-emerald-600">Shop</Link>
        <ChevronRight className="w-4 h-4" />
        {product.category && (
          <>
            <Link to={`/shop?categoryId=${product.category.id}`} className="hover:text-emerald-600">{product.category.name}</Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        {/* Images */}
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-slate-50 aspect-square mb-3">
            <img
              src={images[activeImg]?.storageKey}
              alt={product.name}
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://placehold.co/600x500/e8f5e9/2e7d32?text=${encodeURIComponent(product.name.slice(0, 20))}`;
              }}
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{Math.round(((product.price - product.discountedPrice!) / product.price) * 100)}%
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-emerald-500' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  <img src={img.storageKey} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <Link to={`/shop?categoryId=${product.category.id}`} className="text-sm text-emerald-600 font-medium hover:underline">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1 mb-1">{product.name}</h1>
          {product.genericName && (
            <p className="text-slate-500 text-sm mb-2">Generic: <span className="font-medium text-slate-700">{product.genericName}</span></p>
          )}

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.averageRating} count={product.reviewCount} size="md" />
            <span className="text-sm text-slate-500">SKU: {product.sku}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.requiresPrescription && <Badge variant="orange"><AlertCircle className="w-3 h-3 mr-1" />Prescription Required</Badge>}
            {product.isControlled && <Badge variant="red">Controlled Drug</Badge>}
            {product.isFeatured && <Badge variant="green">Featured</Badge>}
            {product.dosageForm && <Badge variant="blue">{product.dosageForm}</Badge>}
            {product.strength && <Badge variant="gray">{product.strength}</Badge>}
            {product.packSize && <Badge variant="gray">{product.packSize}</Badge>}
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-4">
            <p className="text-3xl font-bold text-slate-800">Rs {effectivePrice.toLocaleString()}</p>
            {hasDiscount && (
              <p className="text-lg text-slate-400 line-through pb-0.5">Rs {product.price.toLocaleString()}</p>
            )}
          </div>

          {/* Stock */}
          <div className={`inline-flex items-center gap-1.5 text-sm font-medium mb-4 px-3 py-1 rounded-full ${inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {inStock ? `${product.totalStock} in stock` : 'Out of Stock'}
          </div>

          {product.shortDescription && (
            <p className="text-slate-600 text-sm leading-relaxed mb-5 border-l-2 border-emerald-300 pl-3">{product.shortDescription}</p>
          )}

          {/* Qty + add to cart */}
          {inStock && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-lg font-bold">−</button>
                <span className="w-10 text-center font-semibold text-slate-800">{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-lg font-bold">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={() => { toggle(product); toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist'); }}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${inWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-500'}`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          )}

          {product.requiresPrescription && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-700">This medicine requires a valid prescription. Please upload your prescription before ordering.</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { icon: Shield, label: '100% Genuine' },
              { icon: Package, label: 'Secure Packing' },
              { icon: Thermometer, label: 'Cold Storage' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl text-center">
                <Icon className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-600 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {product.description && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-emerald-600" />Description</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Dosage Form', value: product.dosageForm },
                  { label: 'Strength', value: product.strength },
                  { label: 'Pack Size', value: product.packSize },
                  { label: 'Manufacturer', value: product.manufacturer?.name },
                  { label: 'SKU', value: product.sku },
                  { label: 'Requires Prescription', value: product.requiresPrescription ? 'Yes' : 'No' },
                ].filter((r) => r.value).map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dosage' && (
            <div className="space-y-4 text-sm text-slate-600">
              {product.storageInstructions && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-1">Storage Instructions</h4>
                  <p>{product.storageInstructions}</p>
                </div>
              )}
              {product.sideEffects && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-800 mb-1">Side Effects</h4>
                  <p>{product.sideEffects}</p>
                </div>
              )}
              {product.contraindications && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-1">Contraindications</h4>
                  <p>{product.contraindications}</p>
                </div>
              )}
              {!product.storageInstructions && !product.sideEffects && !product.contraindications && (
                <p className="text-slate-400 text-center py-8">No dosage/safety information available.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Write review */}
              {isAuthenticated && (
                <form onSubmit={submitReview} className="bg-slate-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> Write a Review
                  </h4>
                  <div className="mb-3">
                    <p className="text-sm text-slate-600 mb-2">Your Rating</p>
                    <StarRating rating={reviewForm.rating} size="md" interactive onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                  </div>
                  <input
                    type="text"
                    placeholder="Review title (optional)"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-emerald-400"
                  />
                  <textarea
                    placeholder="Share your experience..."
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-emerald-400 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {reviews.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{review.user.firstName} {review.user.lastName}</p>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      {review.title && <p className="font-semibold text-sm text-slate-700 mb-1">{review.title}</p>}
                      {review.body && <p className="text-sm text-slate-600">{review.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
