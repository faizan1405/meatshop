import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: 'clamp(32px, 6vw, 80px) 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="animate-fade-up" style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', marginBottom: '20px', color: 'var(--text-dark)' }}>
            About Porville
          </h1>
          <h3 className="animate-fade-up delay-1" style={{ color: 'var(--primary-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.9rem', fontWeight: 700, marginBottom: '20px' }}>
            Fresh Cut. Pure Standards. Since 1986.
          </h3>
          <div className="animate-fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-dark)' }}>
            <p>
              Porville was founded on a simple promise: to elevate the quality of meat available to families in Delhi. Sourced under strict quality guidelines, prepared in advanced temperature-controlled clean facilities, and custom-sliced fresh for every order, we have redefined freshness standards.
            </p>
            <p>
              We believe that the best meals start with the finest ingredients. That is why our chickens are pasture-raised on local farms without antibiotic feeds, our mutton is selected from grass-fed mountain goats, and our farm-fresh eggs are collected daily.
            </p>
            <p>
              Unlike standard supermarkets, we do not package or freeze our meat in advance. When you order from Porville, our master butchers cut the meat exactly to your specifications (curry cuts, steaks, boneless cubes, etc.) only after your order is confirmed.
            </p>
            <p>
              We seal the meat vacuum-tight to protect its natural moisture and flavor, shipping it inside temperature-controlled chilled bags to keep it pristine and fresh. That is the Porville standard.
            </p>

            {/* FSSAI Trust Section */}
            <div style={{
              marginTop: '20px',
              padding: '20px 24px',
              background: '#fff',
              border: '1px solid #c8e6c9',
              borderRadius: '10px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
            }}>
              <ShieldCheck size={32} style={{ color: '#2e7d32', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', color: '#2e7d32', marginBottom: '8px' }}>
                  FSSAI Food Safety Registered
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.7', margin: 0 }}>
                  Porville operates under FSSAI (Food Safety and Standards Authority of India) food safety guidelines. Our business is registered with the Government of Delhi, Department of Food Safety.
                </p>
                <ul style={{ fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: '1.8', marginTop: '10px', paddingLeft: '18px' }}>
                  <li><strong>FoSCoS Reference No:</strong> 30260223123490898</li>
                  <li><strong>Registration Date:</strong> 23-02-2026</li>
                </ul>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dark-muted)', lineHeight: '1.7', marginTop: '8px', margin: '8px 0 0' }}>
                  For food-safety and ordering questions, see our{' '}
                  <Link href="/faq" style={{ color: 'var(--primary-gold-dark)', fontWeight: 600 }}>FAQs</Link>.
                  Private certificate details are not displayed online.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  title: "About Us | Porville",
  description: "Learn about Porville's heritage, antibiotic-free farming, custom butchery process, FSSAI registration, and strict hygiene standards since 1986.",
};
