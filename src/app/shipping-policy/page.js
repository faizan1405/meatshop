import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function ShippingPolicyPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: '60px 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px', backgroundColor: 'var(--white)', padding: '40px', borderRadius: '8px', border: '1px solid var(--border-cream)' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', marginBottom: '20px' }}>Shipping Policy</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)', marginBottom: '20px' }}>Last Updated: June 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <p>
              Porville offers dedicated 2-hour express delivery for all fresh meat and egg products.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>1. Delivery Timings</h3>
            <p>
              Our shipping riders deliver from 7:00 AM to 8:30 PM daily. Orders placed after 7:30 PM will be processed first thing the next morning.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>2. Shipping Charges</h3>
            <p>
              We charge a flat ₹50 shipping fee on all orders below ₹500. Orders above ₹500 are eligible for 100% Free Shipping.
            </p>
            <h3 style={{ fontFamily: 'var(--font-playfair)', marginTop: '10px' }}>3. Temperature Control</h3>
            <p>
              All products are packed inside food-grade vacuum insulated pouches and dispatched in chilled containers to keep the temperature below 4°C during shipping transit.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
