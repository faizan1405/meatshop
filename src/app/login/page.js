'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import styles from './page.module.css';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className={styles.card}>
      <div>
        <h1 className={styles.brandName}>PORVILLE</h1>
        <span className={styles.tagline}>Fresh Cut Pure Standards</span>
      </div>

      <div className={styles.divider} />

      <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 600 }}>
        Welcome to Porville
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-dark-muted)', marginBottom: '10px' }}>
        Create an account or sign in to save your delivery addresses, track orders, and unlock exclusive discounts.
      </p>

      {/* Google Login button */}
      <button onClick={handleGoogleLogin} className={styles.socialBtn}>
        {/* Simple Google SVG icon */}
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.78 2.16c1.63-1.5 2.81-3.72 2.81-6.49z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.78-2.16c-.77.52-1.77.83-3.18.83-2.44 0-4.51-1.65-5.25-3.87L1 12.77C2.49 15.77 5.6 18 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.75 10.6A5.4 5.4 0 0 1 3.5 9c0-.56.1-1.1.25-1.6L1 5.03A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.97 4.03l2.78-2.16z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.3C13.46.89 11.43 0 9 0 5.6 0 2.49 2.23 1 5.03l2.75 2.13C4.49 4.93 6.56 3.58 9 3.58z"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>

      <div className={styles.divider} />

      <p style={{ fontSize: '0.75rem', color: 'var(--text-dark-muted)' }}>
        By logging in, you agree to our Terms & Conditions and Privacy Policy.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.container}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <Suspense fallback={<div className={styles.card}><p>Loading login form...</p></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
