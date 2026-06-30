'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminSettingsPage() {
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // FSSAI fields
  const [fssaiRefNo, setFssaiRefNo] = useState('');
  const [fssaiLicenseName, setFssaiLicenseName] = useState('');
  const [fssaiAddress, setFssaiAddress] = useState('');
  const [fssaiKindOfBusiness, setFssaiKindOfBusiness] = useState('');
  const [fssaiAppDate, setFssaiAppDate] = useState('');
  const [fssaiNote, setFssaiNote] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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
          setLogoUrl(s.logoUrl || '');
          setFssaiRefNo(s.fssaiRefNo || '');
          setFssaiLicenseName(s.fssaiLicenseName || '');
          setFssaiAddress(s.fssaiAddress || '');
          setFssaiKindOfBusiness(s.fssaiKindOfBusiness || '');
          setFssaiAppDate(s.fssaiAppDate || '');
          setFssaiNote(s.fssaiNote || '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setMessage(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, folder: 'porville/logo' }),
        });
        const data = await res.json();
        if (data.success) {
          setLogoUrl(data.url);
          setMessage({ type: 'success', text: 'Logo uploaded! Save settings to apply.' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Logo upload failed.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error uploading logo.' });
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read logo file.' });
      setIsUploadingLogo(false);
    };
  };

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
          logoUrl,
          fssaiRefNo,
          fssaiLicenseName,
          fssaiAddress,
          fssaiKindOfBusiness,
          fssaiAppDate,
          fssaiNote,
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

  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' };
  const inputStyle = { padding: '9px 12px', border: '1px solid var(--border-cream)', borderRadius: '4px', fontSize: '0.85rem', width: '100%' };

  return (
    <form onSubmit={handleSubmit} className={styles.card} style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-cream)', paddingBottom: '12px' }}>
        <Settings size={22} style={{ color: 'var(--primary-gold)' }} />
        <h2 className={styles.cardTitle} style={{ border: 'none', padding: 0, margin: 0 }}>
          Manage Site Settings
        </h2>
      </div>

      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem' }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Business Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '10px' }}>Business Logo</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Business Logo" style={{ height: '60px', objectFit: 'contain', border: '1px solid var(--border-cream)', borderRadius: '6px', padding: '4px', background: '#fff' }} />
          ) : (
            <div style={{ width: '100px', height: '60px', border: '1px dashed var(--border-cream)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark-muted)' }}>
              <ImageIcon size={20} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 14px', border: '1px solid var(--border-cream)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              <UploadCloud size={16} />
              {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={isUploadingLogo} />
            </label>
            <div style={fieldStyle}>
              <label style={labelStyle}>Or paste Logo URL</label>
              <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Business Contacts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '10px' }}>Business Contacts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>Support Phone Number</label>
            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="9217577006" required />
          </div>
          <div className={styles.formGroup}>
            <label>WhatsApp Number (Chat CTA)</label>
            <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="9217577006" required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Contact Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="porville1986@gmail.com" required />
        </div>
        <div className={styles.formGroup}>
          <label>Warehouse / Outlet Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="D-1b/1028, Sangam Vihar-110080" required />
        </div>
      </div>

      {/* Shipping */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '15px' }}>Shipping Charges & Notes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>Delivery Charge (₹)</label>
            <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} placeholder="40" required />
          </div>
          <div className={styles.formGroup}>
            <label>Free Delivery Threshold Order Value (₹)</label>
            <input type="number" value={freeDeliveryThreshold} onChange={(e) => setFreeDeliveryThreshold(e.target.value)} placeholder="770" required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Delivery Guidelines Note</label>
          <input type="text" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="Free delivery on orders above ₹770..." />
        </div>
      </div>

      {/* FSSAI Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '15px' }}>
          FSSAI / Food Safety Details
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)', margin: 0 }}>
          Shown as a trust badge in footer, about page, and checkout. This appears to be a FoSCoS receipt (application reference), not a final license certificate.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>FSSAI Reference No. (FoSCoS)</label>
            <input type="text" value={fssaiRefNo} onChange={(e) => setFssaiRefNo(e.target.value)} placeholder="30260223123490898" />
          </div>
          <div className={styles.formGroup}>
            <label>Application / Registration Date</label>
            <input type="text" value={fssaiAppDate} onChange={(e) => setFssaiAppDate(e.target.value)} placeholder="23-02-2026" />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>License Holder Name</label>
          <input type="text" value={fssaiLicenseName} onChange={(e) => setFssaiLicenseName(e.target.value)} placeholder="Vishal Kumar" />
        </div>
        <div className={styles.formGroup}>
          <label>Registered Address</label>
          <input type="text" value={fssaiAddress} onChange={(e) => setFssaiAddress(e.target.value)} placeholder="Sangam Vihar, New Delhi..." />
        </div>
        <div className={styles.formGroup}>
          <label>Kind of Business</label>
          <textarea rows="2" value={fssaiKindOfBusiness} onChange={(e) => setFssaiKindOfBusiness(e.target.value)} placeholder="Trade/Retail - Wholesaler, Retailer; Manufacturer - Meat processing..." style={{ resize: 'vertical' }} />
        </div>
        <div className={styles.formGroup}>
          <label>Display Note (shown to customers)</label>
          <input type="text" value={fssaiNote} onChange={(e) => setFssaiNote(e.target.value)} placeholder="FSSAI FoSCoS Application Reference No. Registration pending." />
        </div>
      </div>

      {/* Social Profiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, marginTop: '15px' }}>Social Profiles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className={styles.formGroup}>
            <label>Facebook Page URL</label>
            <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/porville" />
          </div>
          <div className={styles.formGroup}>
            <label>Instagram Handle URL</label>
            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/porville" />
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
