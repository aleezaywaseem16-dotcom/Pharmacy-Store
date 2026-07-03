import { Link } from 'react-router-dom';
import { Home, Search, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="text-center">
        <div className="text-8xl font-black text-slate-100 leading-none mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
        <p className="text-slate-500 max-w-sm mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/shop" className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-emerald-400 transition-colors">
            <ShoppingBag className="w-4 h-4" /> Browse Shop
          </Link>
          <Link to="/search" className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-emerald-400 transition-colors">
            <Search className="w-4 h-4" /> Search
          </Link>
        </div>
      </div>
    </div>
  );
}
