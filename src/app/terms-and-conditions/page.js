import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function TermsAndConditionsPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: 'clamp(28px, 5vw, 60px) 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px', backgroundColor: 'var(--white)', padding: 'clamp(20px, 4vw, 40px)', borderRadius: '8px', border: '1px solid var(--border-cream)' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', marginBottom: '20px' }}>Terms & Conditions</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)', marginBottom: '20px' }}>Last Updated: June 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <p>
              Welcome to Porville. By accessing this website and ordering products, you agree to comply with and be bound by the following terms.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>1. Ordering and Meat Preparation</h3>
            <p>
              All products are fresh cuts prepared custom post order confirmations. Price estimates shown on variants are in INR. Stock status may fluctuate dynamically during high demand hours.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>2. Payments and Pricing</h3>
            <p>
              Payments are verified securely online via Razorpay. We do not support Cash on Delivery to minimize touchpoints and preserve complete delivery chain sanitation standards.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>3. Delivery Jurisdiction</h3>
            <p>
              We cater exclusively to Sangam Vihar (110080) and adjoining South Delhi pin codes. Orders outside our operational perimeter will be refunded in full.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
