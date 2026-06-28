'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingBag, User, Phone, MapPin, Menu, X, ShieldAlert } from 'lucide-react';
import { useCart } from '../common/Providers';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { itemsCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if current route is admin
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Return standard admin header later, or a minimal one
    return null; 
  }

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop Cuts', path: '/shop' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header className={styles.header}>
        {/* Top Info Bar */}
        <div className={styles.topBar}>
          <div className="container">
            <div className={styles.topBarContent}>
              <div className={styles.topBarItem}>
                <MapPin size={13} />
                <span>D-1b/1028, Sangam Vihar, New Delhi - 110080</span>
              </div>
              <div className={styles.topBarItem} style={{ gap: '15px' }}>
                <a href="tel:9217577006" className={styles.topBarItem}>
                  <Phone size={13} />
                  <span>Call: 9217577006</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div style={{ height: 'calc(var(--header-height) - 30px)' }}>
          <div className="container" style={{ height: '100%' }}>
            <div className={styles.mainHeader}>
              
              {/* Logo / Branding */}
              <Link href="/" className={styles.brand}>
                <span className={styles.logoText}>PORVILLE</span>
                <span className={styles.tagline}>Fresh Cut Pure Standards</span>
              </Link>

              {/* Desktop Nav */}
              <nav className={styles.nav}>
                {navLinks.map((link) => {
                  const isActive = pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className={styles.actions}>
                {/* Admin Quick Link */}
                {session?.user?.email === 'porville1986@gmail.com' && (
                  <Link href="/admin" className={styles.iconBtn} title="Admin Panel">
                    <ShieldAlert size={20} style={{ color: 'var(--primary-gold)' }} />
                  </Link>
                )}

                {/* Profile Link */}
                <Link href={session ? '/account' : '/login'} className={styles.iconBtn} title="My Account">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name} 
                      style={{ width: '22px', height: '22px', borderRadius: '50%' }} 
                    />
                  ) : (
                    <User size={20} />
                  )}
                </Link>

                {/* Cart Toggle */}
                <button 
                  onClick={() => setIsCartOpen(true)} 
                  className={styles.iconBtn} 
                  title="View Cart"
                >
                  <ShoppingBag size={20} />
                  {itemsCount > 0 && <span className={styles.badge}>{itemsCount}</span>}
                </button>

                {/* Mobile Menu Button */}
                <button 
                  className={`${styles.iconBtn} ${styles.mobileMenuBtn}`}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 'var(--header-height)',
            left: 0,
            width: '100%',
            height: 'calc(100vh - var(--header-height))',
            backgroundColor: 'rgba(12, 11, 10, 0.95)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 20px',
            gap: '25px',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: pathname === link.path ? 'var(--primary-gold)' : 'var(--text-light-muted)',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '10px'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          <a 
            href="tel:9217577006" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '1.1rem',
              color: 'var(--primary-gold)',
              marginTop: '20px'
            }}
          >
            <Phone size={18} />
            <span>Call: 9217577006</span>
          </a>
        </div>
      )}
    </>
  );
}
