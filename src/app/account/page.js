'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { User, MapPin, LogOut, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import styles from './page.module.css';

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Active Tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'addresses'
  
  // Addresses States
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account');
    }
  }, [status, router]);

  // Fetch user addresses on load
  useEffect(() => {
    if (session?.user) {
      fetch('/api/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAddresses(data.addresses);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [session]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <>
        <Header />
        <main className={styles.container}><div className="container">Loading user account...</div></main>
        <Footer />
      </>
    );
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      const data = await res.json();

      if (data.success) {
        setAddresses((prev) => [data.address, ...prev]);
        setAddressForm({
          name: '',
          phone: '',
          streetAddress: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
        });
        setStatusMessage({ type: 'success', text: 'Address added successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to add address.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Server error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/addresses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: id }),
      });
      const data = await res.json();

      if (data.success) {
        setAddresses((prev) => prev.filter((addr) => addr._id !== id));
        setStatusMessage({ type: 'success', text: 'Address deleted successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to delete address.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to delete address.' });
    }
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.container}>
        <div className="container">
          <h1 className={styles.title}>My Porville Account</h1>

          <div className={styles.layout}>
            {/* Sidebar Navigation */}
            <aside className={styles.sidebar}>
              <button
                onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
                className={`${styles.sidebarLink} ${activeTab === 'profile' ? styles.sidebarLinkActive : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left' }}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('addresses'); setStatusMessage(null); }}
                className={`${styles.sidebarLink} ${activeTab === 'addresses' ? styles.sidebarLinkActive : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left' }}
              >
                <MapPin size={16} />
                <span>Manage Addresses</span>
              </button>
              <Link
                href="/orders"
                className={styles.sidebarLink}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ShieldCheck size={16} />
                <span>Order History</span>
              </Link>
              <button
                onClick={handleLogout}
                className={styles.sidebarLink}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', color: 'var(--error)' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </aside>

            {/* Account Details Tab Panel */}
            <div className={styles.mainContent}>
              {statusMessage && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: statusMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
                    color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
                    padding: '12px',
                    borderRadius: 'var(--border-radius-sm)',
                    marginBottom: '20px',
                    fontSize: '0.85rem'
                  }}
                >
                  {statusMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* TAB 1: Profile Details */}
              {activeTab === 'profile' && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Profile Information</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                    {session.user.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name} 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary-gold)' }} 
                      />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-cream-sec)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={36} style={{ color: 'var(--text-dark-muted)' }} />
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-playfair)' }}>{session.user.name}</h3>
                      <p style={{ color: 'var(--text-dark-muted)', fontSize: '0.9rem' }}>{session.user.email}</p>
                      <span style={{ display: 'inline-block', backgroundColor: 'var(--bg-cream-sec)', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--primary-gold-dark)', marginTop: '5px' }}>
                        Customer
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Addresses Details */}
              {activeTab === 'addresses' && (
                <>
                  {/* Saved Addresses grid */}
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Saved Shipping Addresses</h2>
                    {addresses.length === 0 ? (
                      <p style={{ color: 'var(--text-dark-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        No saved addresses found. Add a shipping address below.
                      </p>
                    ) : (
                      <div className={styles.addressGrid}>
                        {addresses.map((addr) => (
                          <div key={addr._id} className={styles.addressCard}>
                            <div className={styles.addressName}>
                              {addr.name} {addr.isDefault && <span style={{ color: 'var(--primary-gold-dark)', fontSize: '0.7rem' }}>(Default)</span>}
                            </div>
                            <div className={styles.addressDetails}>
                              {addr.streetAddress}<br />
                              {addr.city}, {addr.state} - {addr.postalCode}<br />
                              Phone: {addr.phone}
                            </div>
                            <button 
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteAddress(addr._id)}
                              title="Delete Address"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Address Form */}
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Add New Address</h2>
                    <form onSubmit={handleAddAddress} className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Receiver Name</label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Receiver Name"
                          value={addressForm.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Mobile Number</label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="10-digit mobile"
                          value={addressForm.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>Street Address</label>
                        <input
                          type="text"
                          name="streetAddress"
                          placeholder="House, Building, Area details"
                          value={addressForm.streetAddress}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>PIN Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          placeholder="110080"
                          value={addressForm.postalCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Country</label>
                        <input
                          type="text"
                          name="country"
                          value={addressForm.country}
                          disabled
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn-gold fullWidth"
                        disabled={isLoading}
                        style={{ gridColumn: 'span 2', marginTop: '10px' }}
                      >
                        {isLoading ? 'Saving Address...' : 'Save New Address'}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
