import React from 'react';
import { Phone, Mail, MapPin, MessageSquare } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function ContactPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ backgroundColor: 'var(--bg-cream)', padding: 'clamp(32px, 6vw, 80px) 0', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="animate-fade-up" style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', marginBottom: '20px', color: 'var(--text-dark)' }}>
            Contact Porville
          </h1>
          <p className="animate-fade-up delay-1" style={{ color: 'var(--text-dark-muted)', marginBottom: '40px', fontSize: '0.95rem' }}>
            Have questions about custom cuts, wholesale rates, or delivery locations? Reach out to us. We operate daily from 6:00 AM to 9:00 PM.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <div className="lift-card animate-fade-in delay-1" style={{ backgroundColor: 'var(--white)', padding: '25px', borderRadius: '14px', border: '1px solid var(--border-cream)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Phone size={24} style={{ color: 'var(--primary-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem' }}>Call Support</h3>
              <a href="tel:9217577006" style={{ color: 'var(--primary-gold-dark)', fontWeight: 700 }}>
                9217577006
              </a>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)' }}>Daily support lines open.</p>
            </div>

            <div className="lift-card animate-fade-in delay-2" style={{ backgroundColor: 'var(--white)', padding: '25px', borderRadius: '14px', border: '1px solid var(--border-cream)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Mail size={24} style={{ color: 'var(--primary-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem' }}>Email Queries</h3>
              <a href="mailto:porville1986@gmail.com" style={{ color: 'var(--primary-gold-dark)', fontWeight: 700 }}>
                porville1986@gmail.com
              </a>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)' }}>Response within 24 hours.</p>
            </div>

            <div className="lift-card animate-fade-in delay-3" style={{ backgroundColor: 'var(--white)', padding: '25px', borderRadius: '14px', border: '1px solid var(--border-cream)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MapPin size={24} style={{ color: 'var(--primary-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem' }}>Main Hub Address</h3>
              <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                D-1b/1028, Sangam Vihar<br />
                New Delhi - 110080
              </span>
            </div>
          </div>

          <div className="reveal-on-scroll" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-light)', padding: 'clamp(20px, 4vw, 40px)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--primary-gold)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', color: 'var(--primary-gold-light)' }}>
              Instant Chat via WhatsApp
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)', maxWidth: '500px' }}>
              Need a fast answer? Tap below to open our WhatsApp business channel and chat instantly with our store manager.
            </p>
            <a 
              href="https://wa.me/919217577006" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-gold"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}
            >
              <MessageSquare size={18} />
              <span>Open WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  title: "Contact Us | Porville",
  description: "Get in touch with Porville support team. Dial 9217577006 or visit our Sangam Vihar hub for premium cuts.",
};
