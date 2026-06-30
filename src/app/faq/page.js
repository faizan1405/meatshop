import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import FaqInteractive from './FaqInteractive';
import styles from './faq.module.css';

export const metadata = {
  title: 'Frequently Asked Questions | Porville',
  description: 'Find answers about Porville orders, delivery, freshness, hygiene, payments, refunds, and FSSAI registration.',
};

export default function FaqPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      
      <main className={styles.faqContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Frequently Asked Questions</h1>
          <p className={styles.subtitle}>
            Find answers to common questions about our fresh meat cuts, delivery, hygiene practices, and orders.
          </p>
        </div>
        
        <FaqInteractive />
      </main>
      
      <Footer />
    </>
  );
}
