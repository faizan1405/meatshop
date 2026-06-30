'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already logged in as admin
  React.useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'admin')) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn('admin-credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <ShieldCheck size={40} style={{ color: 'var(--primary-gold)' }} />
        </div>
        <h1 className={styles.title}>Porville Admin Panel</h1>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="admin@porville.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--error)', backgroundColor: '#ffebee', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={`${styles.btn} btn-primary`}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
