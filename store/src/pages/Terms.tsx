export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-8">Last updated: July 1, 2026</p>
      <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
        {[
          { title: '1. Acceptance of Terms', body: 'By accessing and using the MediCare Pharmacy platform, you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.' },
          { title: '2. Eligibility', body: 'You must be at least 18 years old to use our services. By using MediCare, you confirm that you are 18 years or older and have the legal capacity to enter into binding contracts.' },
          { title: '3. Prescription Medicines', body: 'Prescription medicines may only be ordered with a valid prescription from a licensed medical practitioner. Providing false prescription information is a criminal offence under Pakistani law. MediCare reserves the right to cancel any order suspected of fraud.' },
          { title: '4. Order & Delivery', body: 'Orders are subject to product availability. We reserve the right to cancel orders in cases of pricing errors, stock unavailability, or suspected fraudulent activity. Delivery times are estimates and may vary due to external factors.' },
          { title: '5. Returns & Refunds', body: 'We accept returns for damaged, expired, or incorrect products within 24 hours of delivery. Medicines cannot be returned once dispensed unless they are defective. Refunds are processed within 5-7 business days.' },
          { title: '6. Prohibited Activities', body: 'You may not use our platform to purchase medicines for resale, provide false prescriptions, attempt to access other users\' accounts, or engage in any activity that violates Pakistani law or DRAP regulations.' },
          { title: '7. Limitation of Liability', body: 'MediCare\'s liability is limited to the amount paid for the specific order in question. We are not liable for indirect, incidental, or consequential damages arising from the use of our platform or products.' },
          { title: '8. Governing Law', body: 'These terms are governed by the laws of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Karachi, Pakistan.' },
          { title: '9. Changes to Terms', body: 'We reserve the right to modify these terms at any time. We will notify users of material changes via email or a prominent notice on our platform. Continued use after changes constitutes acceptance.' },
          { title: '10. Contact', body: 'For questions about these terms, contact us at legal@medicare.pk or at 123 Healthcare Avenue, Karachi, Sindh 75400, Pakistan.' },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-base font-bold text-slate-800 mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
