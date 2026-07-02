'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, MessageSquare, ShieldCheck } from 'lucide-react';
import styles from './Footer.module.css';

// lucide-react v1 dropped brand icons — inline minimal SVG marks instead
function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

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
  const fssaiNote = settings?.fssaiNote || '';

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
                <img
                  src="/porville-logo.jpg"
                  alt="Porville — Fresh Cut, Pure Standards"
                  style={{
                    width: '112px',
                    height: '112px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary-gold)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                    marginBottom: '10px',
                  }}
                />
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
                aria-label="Chat on WhatsApp"
              >
                <MessageSquare size={18} />
              </a>
              {settings?.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  title="Follow us on Facebook"
                  aria-label="Follow us on Facebook"
                >
                  <FacebookIcon size={18} />
                </a>
              )}
              {settings?.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  title="Follow us on Instagram"
                  aria-label="Follow us on Instagram"
                >
                  <InstagramIcon size={18} />
                </a>
              )}
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
              <li><Link href="/faq" className={styles.link}>FAQs</Link></li>
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
              <strong style={{ color: 'var(--text-light)' }}>Date:</strong> {fssaiAppDate}
              {fssaiNote && (
                <>
                  &nbsp;|&nbsp;
                  <span style={{ fontStyle: 'italic' }}>{fssaiNote}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom info */}
        <div className={styles.bottom}>
          <p>© {currentYear} Porville. All Rights Reserved. Branding: &quot;Fresh Cut Pure Standards&quot;.</p>
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
