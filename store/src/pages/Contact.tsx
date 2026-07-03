import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="animate-fade-in">
      <section className="bg-pharmacy-gradient text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-emerald-100">We're here to help. Reach out to our team anytime.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Info */}
          <div className="md:col-span-2 space-y-5">
            <h2 className="text-xl font-bold text-slate-800">Get in Touch</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Have questions about your order, need pharmaceutical advice, or want to partner with us? We'd love to hear from you.
            </p>

            {[
              { icon: MapPin, title: 'Address', lines: ['123 Healthcare Avenue', 'Karachi, Sindh 75400', 'Pakistan'] },
              { icon: Phone, title: 'Phone', lines: ['+92 300 1234567', '+92 21 3456789'] },
              { icon: Mail, title: 'Email', lines: ['support@medicare.pk', 'orders@medicare.pk'] },
              { icon: Clock, title: 'Working Hours', lines: ['Monday – Saturday: 9am – 6pm', 'Sunday: 10am – 4pm'] },
            ].map(({ icon: Icon, title, lines }) => (
              <div key={title} className="flex gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  {lines.map((l) => <p key={l} className="text-slate-500 text-sm">{l}</p>)}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Message Sent!</h3>
                <p className="text-slate-600">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mt-5 text-emerald-600 font-medium text-sm hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-7 space-y-4 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-2">Send a Message</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Your Name</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ali Ahmed" required
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Subject</label>
                  <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Order query / Prescription help..." required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Message</label>
                  <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Tell us how we can help..." rows={5} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all resize-none" />
                </div>
                <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors">
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
