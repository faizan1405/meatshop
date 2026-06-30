import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Globe, UserCheck } from 'lucide-react';
import AdminLayoutClient from './AdminLayoutClient';
import AdminNav from './AdminNav';
import styles from './layout.module.css';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  // If there is no admin session, render children directly (this handles /admin/login view cleanly)
  if (!session || session.user?.role !== 'admin') {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminContainer}>
      
      {/* Admin Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoText}>PORVILLE ADMIN</span>
        </div>
        <AdminNav />
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navLink} style={{ color: 'var(--text-light-muted)' }}>
            <Globe size={18} />
            <span>Public Site</span>
          </Link>
          <AdminLayoutClient logoutOnly />
        </div>
      </aside>

      {/* Main Admin Panel area */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>Porville Management Hub</div>
          <div className={styles.adminUserBadge}>
            <UserCheck size={18} style={{ color: 'var(--primary-gold)' }} />
            <span>Logged in: {session.user.name}</span>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

    </div>
  );
}
