import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: '80px 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', marginBottom: '20px', color: 'var(--text-dark)' }}>
            About Porville
          </h1>
          <h3 style={{ color: 'var(--primary-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.9rem', fontWeight: 700, marginBottom: '20px' }}>
            Fresh Cut. Pure Standards. Since 1986.
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-dark)' }}>
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  title: "About Us | Porville",
  description: "Learn about Porville's heritage, antibiotic-free farming, custom butchery process, and strict hygiene standards since 1986.",
};
