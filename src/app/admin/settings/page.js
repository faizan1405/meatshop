'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminSettingsPage() {
  // Site settings state
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const s = data.settings;
          setContactNumber(s.contactNumber || '');
          setEmail(s.email || '');
          setAddress(s.address || '');
          setDeliveryNote(s.deliveryNote || '');
          setDeliveryCharge(s.deliveryCharge?.toString() || '');
          setFreeDeliveryThreshold(s.freeDeliveryThreshold?.toString() || '');
          setWhatsappNumber(s.whatsappNumber || '');
          setFacebookUrl(s.facebookUrl || '');
          setInstagramUrl(s.instagramUrl || '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactNumber,
          email,
          address,
          deliveryNote,
          deliveryCharge,
          freeDeliveryThreshold,
          whatsappNumber,
          facebookUrl,
          instagramUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Site settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.card} style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-cream)', paddingBottom: '12px' }}>
        <Settings size={22} style={{ color: 'var(--primary-gold)' }} />
        <h2 className={styles.cardTitle} style={{ border: 'none', padding: 0, margin: 0 }}>
          Manage Site Settings
        </h2>
      </div>

      {message && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
            color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '0.85rem'
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '10px' }}>Business Contacts</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>Support Phone Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="9217577006"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>WhatsApp Number (Chat CTA)</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="9217577006"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="porville1986@gmail.com"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Warehouse / Outlet Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="D-1b/1028, Sangam Vihar-110080"
            required
          />
        </div>

        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '15px' }}>Shipping Charges & Notes</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>Delivery Charge (₹)</label>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              placeholder="50"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Free Delivery Threshold Order Value (₹)</label>
            <input
              type="number"
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
              placeholder="500"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Delivery Guidelines Note (Shows in Drawer-Cart/Header)</label>
          <input
            type="text"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="Express delivery within 2 hours. Minimum order value may apply."
          />
        </div>

        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '15px' }}>Social Profiles</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>Facebook Page URL</label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/porville"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Instagram Handle URL</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/porville"
            />
          </div>
        </div>

      </div>

      <button
        type="submit"
        className="btn-gold"
        disabled={isSaving}
        style={{ width: '100%', padding: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
      >
        <Save size={18} />
        <span>{isSaving ? 'Saving Configurations...' : 'Save Settings'}</span>
      </button>
    </form>
  );
}
