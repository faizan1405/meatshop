import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: 'clamp(28px, 5vw, 60px) 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px', backgroundColor: 'var(--white)', padding: 'clamp(20px, 4vw, 40px)', borderRadius: '8px', border: '1px solid var(--border-cream)' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', marginBottom: '20px' }}>Privacy Policy</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)', marginBottom: '20px' }}>Last Updated: June 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <p>
              Porville ("we", "our", or "us") respects your privacy. This privacy policy describes what personal data we collect when you use our website, place orders, or contact us.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>1. Data Collection</h3>
            <p>
              We collect information you provide directly, such as your name, email address, phone number, shipping address, and guest information during checkouts. If you sign in via Google, we receive name, email, and profile image from the auth provider.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>2. How We Use Data</h3>
            <p>
              We use your data to process orders, manage deliveries, verify payments (via Razorpay), display customized order tracking, and moderate product reviews.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>3. Data Sharing</h3>
            <p>
              We do not sell your personal data. We share necessary details only with verified payment partners (Razorpay) and shipping personnel to complete orders.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
