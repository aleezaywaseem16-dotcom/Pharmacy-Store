import { Shield, Award, Users, Heart, Truck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-pharmacy-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About MediCare Pharmacy</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Pakistan's most trusted online pharmacy, committed to making genuine medicines accessible to everyone.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Story</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              MediCare Pharmacy was founded with a simple mission: to make quality healthcare accessible to every Pakistani household. We saw the challenges people faced in finding genuine medicines, comparing prices, and getting reliable pharmaceutical advice.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Today, we serve thousands of customers across Pakistan, offering over 10,000 medicines and healthcare products — all sourced directly from licensed manufacturers and distributors.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our team of licensed pharmacists reviews every order to ensure safety, authenticity, and proper dispensing — especially for prescription medications.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, value: '50,000+', label: 'Happy Customers', color: 'bg-emerald-50 text-emerald-600' },
              { icon: Shield, value: '100%', label: 'Genuine Products', color: 'bg-blue-50 text-blue-600' },
              { icon: Truck, value: '48hr', label: 'Delivery Time', color: 'bg-orange-50 text-orange-600' },
              { icon: Award, value: 'DRAP', label: 'Certified', color: 'bg-purple-50 text-purple-600' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-10">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Authenticity', desc: 'Every product we sell is sourced from licensed suppliers and verified for authenticity. No counterfeits, ever.' },
              { icon: Heart, title: 'Patient First', desc: 'Your health and safety come before everything. Our pharmacists are available to answer your questions anytime.' },
              { icon: Award, title: 'Quality Assurance', desc: 'We maintain strict cold-chain storage for temperature-sensitive medicines and follow all DRAP guidelines.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Licensed by DRAP</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-8">
          MediCare Pharmacy is fully licensed by the Drug Regulatory Authority of Pakistan (DRAP) and complies with all pharmaceutical regulations. Our pharmacists are registered with the Pharmacy Council of Pakistan.
        </p>
        <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
          <Phone className="w-4 h-4" /> Contact Us
        </Link>
      </section>
    </div>
  );
}
