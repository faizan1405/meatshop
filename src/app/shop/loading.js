import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { Search } from 'lucide-react';
import styles from './page.module.css';

export default function ShopLoading() {
  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.shopContainer}>
        <div className="container">
          <h1 className={styles.title}>Browse Porville Cuts</h1>

          <div className={styles.shopLayout}>
            {/* Sidebar Filters Skeleton */}
            <aside className={styles.sidebar}>
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>
                  <Search size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary-gold)' }} />
                  Search
                </h3>
                <div style={{ height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              </div>
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>Categories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ height: '20px', width: `${Math.random() * 40 + 40}%`, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  ))}
                </div>
              </div>
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>Product Types</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ height: '20px', width: `${Math.random() * 40 + 40}%`, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Products Grid Skeleton */}
            <div className={styles.mainContent}>
              <div className={styles.productsGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ backgroundColor: 'var(--bg-card, rgba(20,20,20,0.5))', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '100%', height: '220px', backgroundColor: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ height: '14px', width: '40%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '10px', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                      <div style={{ height: '20px', width: '80%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '15px', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                      <div style={{ height: '36px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '15px', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ height: '24px', width: '30%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                        <div style={{ height: '36px', width: '90px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}} />
    </>
  );
}
