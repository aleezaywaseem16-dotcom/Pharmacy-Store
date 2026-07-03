import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown,
  Package, LogOut, MapPin, Clock, Pill
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import api, { showError } from '@/lib/api';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const navigate = useNavigate();
  const location = useLocation();
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    clearAuth();
    navigate('/');
  };

  const count = itemCount();

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white border-b border-slate-100'}`}>
      {/* Top bar */}
      <div className="bg-emerald-700 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Pill className="w-3 h-3" /> Free delivery on orders above Rs 1,500
          </span>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/faq" className="hover:text-emerald-200 transition-colors">Help</Link>
            <Link to="/contact" className="hover:text-emerald-200 transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">
              Medi<span className="text-emerald-600">Care</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="flex w-full rounded-lg overflow-hidden border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                type="text"
                placeholder="Search medicines, brands, categories..."
                className="flex-1 px-4 py-2 text-sm outline-none bg-white"
              />
              <button
                type="submit"
                className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <Heart className="w-5 h-5 text-slate-600" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-slate-600" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.firstName[0]}{user?.lastName[0]}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="font-semibold text-sm text-slate-800">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    {[
                      { icon: User, label: 'Profile', to: '/profile' },
                      { icon: Clock, label: 'Order History', to: '/orders' },
                      { icon: Package, label: 'Track Order', to: '/track' },
                      { icon: MapPin, label: 'Addresses', to: '/addresses' },
                    ].map(({ icon: Icon, label, to }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setUserOpen(false)}
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-emerald-700 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-slate-50 rounded-lg transition-colors ml-1"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 pb-2 text-sm font-medium border-t border-slate-50 pt-1">
          {[
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            { label: 'Categories', to: '/categories' },
            { label: 'About', to: '/about' },
            { label: 'Contact', to: '/contact' },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`py-1 border-b-2 transition-colors ${location.pathname === to ? 'text-emerald-700 border-emerald-600' : 'text-slate-600 hover:text-emerald-700 border-transparent'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-fade-in">
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex mb-4">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                type="text"
                placeholder="Search medicines..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-l-lg outline-none"
              />
              <button type="submit" className="px-4 bg-emerald-600 text-white rounded-r-lg">
                <Search className="w-4 h-4" />
              </button>
            </form>
            <div className="space-y-1">
              {[
                ['/', 'Home'],
                ['/shop', 'Shop'],
                ['/categories', 'Categories'],
                ['/about', 'About'],
                ['/contact', 'Contact'],
                ['/wishlist', 'Wishlist'],
                ['/cart', 'Cart'],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="block py-2.5 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
                >
                  {label}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="block py-2.5 px-3 text-emerald-700 font-semibold text-sm">Login</Link>
                  <Link to="/register" className="block py-2.5 px-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold text-center">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
