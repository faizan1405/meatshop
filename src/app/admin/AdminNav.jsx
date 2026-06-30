'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  ClipboardList,
  Image,
  MessageSquare,
  Settings,
} from 'lucide-react';
import styles from './layout.module.css';

const menuItems = [
  { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { name: 'Products', path: '/admin/products', icon: <ShoppingBag size={18} /> },
  { name: 'Categories', path: '/admin/categories', icon: <Tag size={18} /> },
  { name: 'Orders', path: '/admin/orders', icon: <ClipboardList size={18} /> },
  { name: 'Coupons', path: '/admin/coupons', icon: <Tag size={18} /> },
  { name: 'Banners', path: '/admin/banners', icon: <Image size={18} /> },
  { name: 'Reviews', path: '/admin/reviews', icon: <MessageSquare size={18} /> },
  { name: 'Site Settings', path: '/admin/settings', icon: <Settings size={18} /> },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (path) => {
    // Dashboard matches its exact route only — otherwise it would match every /admin/* path
    if (path === '/admin') {
      return pathname === '/admin';
    }
    // Nested routes (e.g. /admin/products/new, /admin/orders/[id]) highlight their parent
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <nav className={styles.nav}>
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          aria-current={isActive(item.path) ? 'page' : undefined}
          className={`${styles.navLink} ${isActive(item.path) ? styles.navLinkActive : ''}`}
        >
          {item.icon}
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
