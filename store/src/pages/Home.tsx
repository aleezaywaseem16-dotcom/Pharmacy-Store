import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Truck, Clock, Award, ChevronRight, Pill } from 'lucide-react';
import api from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { PageSpinner } from '@/components/ui/Spinner';

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/products/featured'),
      api.get('/categories?limit=8'),
    ]).then(([fp, cp]) => {
      setFeatured(fp.data.data ?? []);
      setCategories(cp.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const categoryColors = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-500',
    'from-teal-500 to-emerald-600',
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-hero-pattern relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Pill className="w-4 h-4" />
              Pakistan's Most Trusted Online Pharmacy
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Your Health,<br />
              <span className="text-emerald-300">Our Priority</span>
            </h1>
            <p className="text-emerald-100 text-lg mb-8 max-w-md">
              Order genuine medicines, vitamins, and healthcare products. Delivered fast, right to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/categories"
                className="flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Browse Categories
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-10">
              {[['10K+', 'Products'], ['50K+', 'Customers'], ['99%', 'Genuine']].map(([val, lbl]) => (
                <div key={lbl} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse-ring" />
              <div className="absolute inset-6 bg-white/15 rounded-full backdrop-blur flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
                    <Pill className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-white font-bold text-lg">MediCare</p>
                  <p className="text-emerald-200 text-sm">Pharmacy</p>
                </div>
              </div>
              {/* Floating badges */}
              {[
                { label: '🚚 Free Delivery', pos: 'top-4 -left-4' },
                { label: '✅ Verified', pos: 'top-8 -right-6' },
                { label: '⚡ Fast', pos: 'bottom-12 -left-6' },
                { label: '🔒 Secure', pos: 'bottom-4 -right-4' },
              ].map(({ label, pos }) => (
                <div key={label} className={`absolute ${pos} bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg`}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: 'Free Delivery', desc: 'On orders above Rs 1,500', color: 'text-emerald-600 bg-emerald-50' },
              { icon: Shield, title: '100% Genuine', desc: 'Verified medicines only', color: 'text-blue-600 bg-blue-50' },
              { icon: Clock, title: 'Same Day', desc: 'Express delivery available', color: 'text-orange-600 bg-orange-50' },
              { icon: Award, title: 'Licensed', desc: 'DRAP approved pharmacy', color: 'text-purple-600 bg-purple-50' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Shop by Category</h2>
              <p className="text-slate-500 text-sm mt-1">Find what you need quickly</p>
            </div>
            <Link to="/categories" className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/shop?categoryId=${cat.id}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br hover:shadow-lg transition-all cursor-pointer"
                style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[i % categoryColors.length]} flex items-center justify-center text-white text-xl shadow-md group-hover:scale-110 transition-transform`}>
                  💊
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Featured Medicines</h2>
                <p className="text-slate-500 text-sm mt-1">Top rated products from our pharmacy</p>
              </div>
              <Link to="/shop?isFeatured=true" className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="bg-pharmacy-gradient rounded-3xl overflow-hidden">
          <div className="px-8 py-10 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">Need a Prescription Medicine?</h2>
            <p className="text-emerald-100 mb-6 max-w-lg mx-auto">
              Upload your prescription and our licensed pharmacists will verify and process your order within hours.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Shop Prescription Medicines <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Shop all */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">All Products</h2>
            <p className="text-slate-500 text-sm mt-1">Browse our complete catalogue</p>
          </div>
          <Link to="/shop" className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <AllProducts />
      </section>
    </div>
  );
}

function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=8&isActive=true')
      .then((r) => setProducts(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
