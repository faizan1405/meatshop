'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import styles from './layout.module.css';

export default function AdminLayoutClient({ logoutOnly }) {
  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  if (logoutOnly) {
    return (
      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    );
  }

  return null;
}
