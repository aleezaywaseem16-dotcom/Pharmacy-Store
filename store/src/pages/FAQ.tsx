import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'How do I place an order?', a: 'Browse our shop, add items to your cart, sign in, and proceed to checkout. Choose your delivery address and payment method, then confirm your order.' },
  { q: 'Are all medicines genuine?', a: 'Yes, 100%. All medicines are sourced directly from DRAP-licensed distributors and manufacturers. We do not sell counterfeit or substandard products.' },
  { q: 'What is the delivery time?', a: 'Standard delivery takes 24-48 hours within city limits. Express delivery (same day) is available in Karachi for orders placed before 2 PM.' },
  { q: 'How do I upload a prescription?', a: 'Go to your account, click "Prescriptions", and upload a clear photo of your doctor\'s prescription. Our pharmacist will verify it within 2-4 hours.' },
  { q: 'Can I cancel my order?', a: 'Yes, you can cancel orders in "Pending" or "Confirmed" status. Go to Order History, select the order, and click "Cancel Order".' },
  { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery, Credit/Debit Cards, Mobile Wallets (JazzCash, Easypaisa), and Bank Transfer.' },
  { q: 'Is my personal and medical information secure?', a: 'Absolutely. We use industry-standard encryption and never share your medical information with third parties without your consent.' },
  { q: 'What is the return policy?', a: 'If you receive a damaged, expired, or incorrect product, contact us within 24 hours of delivery for a full replacement or refund.' },
  { q: 'How do I track my order?', a: 'Visit the "Track Order" page and enter your Order ID. You can also view order status in "Order History" under your account.' },
  { q: 'Is there a minimum order value?', a: 'No minimum order. Orders above Rs 1,500 qualify for free delivery. A flat Rs 150 delivery charge applies to smaller orders.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="animate-fade-in">
      <section className="bg-pharmacy-gradient text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-emerald-100">Everything you need to know about ordering from MediCare.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-800 text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed animate-fade-in border-t border-slate-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <p className="font-semibold text-slate-800 mb-1">Still have questions?</p>
          <p className="text-slate-600 text-sm mb-4">Our team is available 6 days a week to help you.</p>
          <a href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
