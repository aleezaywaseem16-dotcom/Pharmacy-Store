export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-8">Last updated: July 1, 2026</p>
      <div className="prose prose-slate prose-sm max-w-none space-y-6 text-slate-600 leading-relaxed">
        {[
          { title: '1. Information We Collect', body: 'We collect personal information you provide directly, including your name, email address, phone number, delivery address, and payment information. We also collect information about your orders and browsing activity on our platform.' },
          { title: '2. How We Use Your Information', body: 'We use your information to process and fulfill your orders, send order confirmations and delivery updates, provide customer support, verify prescriptions with our licensed pharmacists, improve our services, and comply with legal obligations.' },
          { title: '3. Medical Information', body: 'Prescription information and medical records are treated with the highest level of confidentiality. This information is only accessed by our licensed pharmacists for order verification and is never shared with third parties without your explicit consent, except as required by law.' },
          { title: '4. Data Security', body: 'We implement industry-standard security measures including SSL/TLS encryption, secure password hashing, and access controls to protect your personal and medical information from unauthorized access, disclosure, or loss.' },
          { title: '5. Cookies', body: 'We use cookies to maintain your session, remember your cart, and analyze usage patterns. You can control cookie settings through your browser. Disabling cookies may affect certain features of our platform.' },
          { title: '6. Data Sharing', body: 'We do not sell your personal information. We share data with delivery partners to fulfill orders, payment processors to handle transactions, and regulatory authorities as required by DRAP and Pakistani law.' },
          { title: '7. Your Rights', body: 'You have the right to access, correct, or delete your personal information. You may also request a copy of the data we hold about you. Contact us at privacy@medicare.pk to exercise these rights.' },
          { title: '8. Contact', body: 'For privacy-related concerns, contact our Data Protection Officer at privacy@medicare.pk or write to us at 123 Healthcare Avenue, Karachi, Pakistan.' },
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
