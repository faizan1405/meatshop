import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: 'clamp(28px, 5vw, 60px) 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px', backgroundColor: 'var(--white)', padding: 'clamp(20px, 4vw, 40px)', borderRadius: '8px', border: '1px solid var(--border-cream)' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', marginBottom: '20px' }}>Refund & Cancellation Policy</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)', marginBottom: '20px' }}>Last Updated: June 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <p>
              Since our products are perishable fresh meat items, we do not accept returns. However, customer satisfaction is our top priority.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>1. Cancellations</h3>
            <p>
              Orders can only be cancelled within 10 minutes of placement before our butchers start preparing your custom cuts. Once preparation starts, cancellations are not permitted.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>2. Refunds & Freshness Issues</h3>
            <p>
              If your package arrived damaged, opened, or does not meet our high freshness standards, please contact us immediately on WhatsApp (9217577006) with photos of the package.
            </p>
            <p>
              Upon verification, we will issue a complete replacement or a direct refund to your original payment method within 3 to 5 business days.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
