import { Link } from 'react-router-dom';
import { Pill, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">
                Medi<span className="text-emerald-400">Care</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 mb-4">
              Your trusted online pharmacy delivering genuine medicines and healthcare products across Pakistan.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <button key={i} className="w-8 h-8 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['/', 'Home'], ['/shop', 'Shop'], ['/categories', 'Categories'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-emerald-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">My Account</h4>
            <ul className="space-y-2 text-sm">
              {[['/profile', 'Profile'], ['/orders', 'Order History'], ['/track', 'Track Order'], ['/wishlist', 'Wishlist'], ['/addresses', 'Addresses']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-emerald-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>123 Healthcare Avenue, Karachi, Pakistan</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+92 300 1234567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>support@medicare.pk</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Working Hours</p>
              <p className="text-sm text-white font-medium">Mon–Sat: 9am – 6pm</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 MediCare Pharmacy. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
