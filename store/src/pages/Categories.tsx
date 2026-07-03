import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid3X3, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { Category } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

const gradients = [
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-cyan-400 to-blue-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-teal-400 to-emerald-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
];

const emojis = ['💊', '🩺', '🧬', '💉', '🌿', '🩻', '🧴', '💉', '🫀', '🧪'];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Browse Categories</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Find medicines and healthcare products organized by category for easy navigation.
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Grid3X3} title="No categories yet" description="Categories will appear here once added." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/shop?categoryId=${cat.id}`}
              className="group card-hover bg-white rounded-2xl overflow-hidden border border-slate-100"
            >
              <div className={`bg-gradient-to-br ${gradients[i % gradients.length]} p-8 flex items-center justify-center text-4xl`}>
                {emojis[i % emojis.length]}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-medium">
                  Shop now <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
