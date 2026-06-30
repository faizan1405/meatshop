'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, MessageSquare, ShieldCheck } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!isAdminRoute) {
      fetch('/api/admin/settings')
        .then((r) => r.json())
        .then((d) => { if (d.success) setSettings(d.settings); })
        .catch(() => {});
    }
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const logoUrl = settings?.logoUrl || '';
  const fssaiRefNo = settings?.fssaiRefNo || '30260223123490898';
  const fssaiAppDate = settings?.fssaiAppDate || '23-02-2026';
  const fssaiNote = settings?.fssaiNote || 'FSSAI FoSCoS Application Reference No. Registration pending.';

  return (
    <footer className={styles.footer}>
      <div className="container">

        {/* Footer Top Grid */}
        <div className={styles.grid}>

          {/* Brand Info */}
          <div className={styles.col}>
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Porville Logo"
                  style={{ height: '48px', maxWidth: '160px', objectFit: 'contain', marginBottom: '6px' }}
                />
              ) : (
                <h2 className={styles.brandText}>PORVILLE</h2>
              )}
              <p className={styles.tagline}>Fresh Cut Pure Standards</p>
            </div>
            <p className={styles.desc}>
              Premium fresh cuts of quality meats processed in a temperature-controlled environment and delivered straight to your kitchen. We guarantee the highest standards of hygiene and taste.
            </p>
            {/* Social / Contact Icons */}
            <div className={styles.socials}>
              <a
                href={`https://wa.me/91${settings?.whatsappNumber || '9217577006'}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Chat on WhatsApp"
              >
                <MessageSquare size={18} />
              </a>
            </div>
          </div>

          {/* Quick Shop categories */}
          <div className={styles.col}>
            <h3 className={styles.heading}>Fresh Cuts</h3>
            <ul className={styles.list}>
              <li><Link href="/category/chicken" className={styles.link}>Premium Chicken</Link></li>
              <li><Link href="/category/mutton" className={styles.link}>Tender Mutton</Link></li>
              <li><Link href="/category/eggs" className={styles.link}>Farm Fresh Eggs</Link></li>
              <li><Link href="/category/ready-to-eat" className={styles.link}>Ready to Eat</Link></li>
            </ul>
          </div>

          {/* Customer support links */}
          <div className={styles.col}>
            <h3 className={styles.heading}>Information</h3>
            <ul className={styles.list}>
              <li><Link href="/about" className={styles.link}>About Porville</Link></li>
              <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
              <li><Link href="/shop" className={styles.link}>Browse Shop</Link></li>
              <li><Link href="/privacy-policy" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className={styles.link}>Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact details */}
          <div className={styles.col}>
            <h3 className={styles.heading}>Get In Touch</h3>
            <ul className={styles.list}>
              <li className={styles.contactItem}>
                <Phone size={16} />
                <div>
                  <strong>Phone:</strong><br />
                  <a href={`tel:${settings?.contactNumber || '9217577006'}`} className={styles.contactLink}>
                    {settings?.contactNumber || '9217577006'}
                  </a>
                </div>
              </li>
              <li className={styles.contactItem}>
                <Mail size={16} />
                <div>
                  <strong>Email:</strong><br />
                  <a href={`mailto:${settings?.email || 'porville1986@gmail.com'}`} className={styles.contactLink}>
                    {settings?.email || 'porville1986@gmail.com'}
                  </a>
                </div>
              </li>
              <li className={styles.contactItem}>
                <MapPin size={16} />
                <div>
                  <strong>Address:</strong><br />
                  {settings?.address || 'D-1b/1028, Sangam Vihar, New Delhi - 110080'}
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* FSSAI Trust Badge */}
        <div style={{
          margin: '28px 0 0',
          padding: '14px 18px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <ShieldCheck size={22} style={{ color: '#4caf50', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#4caf50', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              FSSAI Food Safety Registered
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', lineHeight: '1.5' }}>
              <strong style={{ color: 'var(--text-light)' }}>FoSCoS Ref No:</strong> {fssaiRefNo} &nbsp;|&nbsp;
              <strong style={{ color: 'var(--text-light)' }}>Date:</strong> {fssaiAppDate} &nbsp;|&nbsp;
              <span style={{ fontStyle: 'italic' }}>{fssaiNote}</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom info */}
        <div className={styles.bottom}>
          <p>© {currentYear} Porville. All Rights Reserved. Branding: "Fresh Cut Pure Standards".</p>
          <div className={styles.bottomLinks}>
            <Link href="/shipping-policy" className={styles.link} style={{ fontSize: '0.75rem' }}>
              Shipping Policy
            </Link>
            <Link href="/refund-policy" className={styles.link} style={{ fontSize: '0.75rem' }}>
              Refund & Cancellation
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
