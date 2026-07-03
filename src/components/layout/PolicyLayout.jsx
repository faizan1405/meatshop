import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

/**
 * Shared shell for legal / policy pages. Server component — keeps the premium
 * card layout, headings, and spacing identical across every policy page so they
 * read as one consistent set. Content is passed as children.
 */
export default function PolicyLayout({ title, intro, updated = 'June 2026', children }) {
  return (
    <>
      <Header />
      <CartDrawer />
      <main
        style={{
          backgroundColor: 'var(--bg-cream)',
          padding: 'clamp(28px, 5vw, 60px) 0',
          minHeight: 'calc(100vh - var(--header-height))',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '820px',
            backgroundColor: 'var(--white)',
            padding: 'clamp(22px, 4vw, 44px)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-cream)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(1.6rem, 4vw, 2.1rem)',
              marginBottom: '8px',
              color: 'var(--text-dark)',
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dark-muted)', marginBottom: '22px' }}>
            Last Updated: {updated}
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              fontSize: '0.92rem',
              lineHeight: '1.75',
              color: 'var(--text-dark)',
            }}
          >
            {intro && <p>{intro}</p>}
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Section sub-heading — Playfair, matches existing legal page headings. */
export function PolicyHeading({ children }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-playfair)',
        fontSize: '1.15rem',
        marginTop: '10px',
        marginBottom: '-4px',
        color: 'var(--text-dark)',
      }}
    >
      {children}
    </h2>
  );
}

/** Bullet list — consistent spacing/indent for policy points. */
export function PolicyList({ items }) {
  return (
    <ul style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
