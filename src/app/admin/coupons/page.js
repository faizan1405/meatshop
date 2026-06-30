'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscountValue, setMaxDiscountValue] = useState('');
  const [active, setActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchCoupons = () => {
    setIsLoading(true);
    fetch('/api/admin/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCoupons(data.coupons);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleEditClick = (c) => {
    setEditingId(c._id);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue.toString());
    setMinOrderValue(c.minOrderValue?.toString() || '0');
    setMaxDiscountValue(c.maxDiscountValue?.toString() || '');
    setActive(c.active);
    setExpiryDate(c.expiryDate.split('T')[0]); // YYYY-MM-DD
    setMessage(null);
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/coupons/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const created = data.results.filter((r) => r.action === 'created').map((r) => r.code).join(', ');
        const skipped = data.results.filter((r) => r.action !== 'created').length;
        setMessage({
          type: 'success',
          text: created
            ? `Created: ${created}${skipped ? ` | ${skipped} already existed.` : ''}`
            : 'All default coupons already exist.',
        });
        fetchCoupons();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to seed coupons.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error seeding default coupons.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('0');
    setMaxDiscountValue('');
    setActive(true);
    setExpiryDate('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponId: editingId,
          code,
          discountType,
          discountValue,
          minOrderValue,
          maxDiscountValue: maxDiscountValue || null,
          active,
          expiryDate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingId ? 'Coupon updated successfully!' : 'Coupon created successfully!' });
        handleReset();
        fetchCoupons();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save coupon.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error saving coupon details.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Left Form */}
      <div style={{ flex: '1 1 300px' }}>
        <form onSubmit={handleSubmit} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 className={styles.cardTitle} style={{ border: 'none', padding: 0, margin: 0 }}>
            {editingId ? 'Modify Coupon' : 'Create Promo Coupon'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Coupon Code (Uppercase)</label>
            <input
              type="text"
              placeholder="e.g. MEATLOVER20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              required
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Discount Value ({discountType === 'percentage' ? '%' : '₹'})
            </label>
            <input
              type="number"
              placeholder={discountType === 'percentage' ? '15' : '150'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Minimum Order Value (₹)</label>
            <input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
            />
          </div>

          {discountType === 'percentage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Maximum Discount Limit (₹)</label>
              <input
                type="number"
                placeholder="Unlimited if empty"
                value={maxDiscountValue}
                onChange={(e) => setMaxDiscountValue(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <label htmlFor="active" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Coupon is Active
            </label>
          </div>

          {message && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', fontSize: '0.8rem' }}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn-gold" style={{ flex: 1, display: 'flex', justifyContent: 'center' }} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleReset} className="btn-primary btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right List Table */}
      <div style={{ flex: '2 1 500px' }} className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-cream)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 'none' }}>Promo Coupons List</h2>
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            title="Insert PORVILLE10, FRESH10, CHICKEN10, MEAT10 into the database"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.78rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', borderRadius: '4px', cursor: isSeeding ? 'not-allowed' : 'pointer', opacity: isSeeding ? 0.6 : 1 }}
          >
            <Zap size={14} />
            {isSeeding ? 'Seeding...' : 'Add Default Coupons'}
          </button>
        </div>

        {isLoading ? (
          <div>Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <p>No coupons found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min. Order</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.code}</strong>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{c.discountType}</td>
                  <td>
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td>₹{c.minOrderValue}</td>
                  <td>{new Date(c.expiryDate).toLocaleDateString('en-IN', { dateStyle: 'short' })}</td>
                  <td>
                    <span 
                      style={{ 
                        fontWeight: 700, 
                        color: c.active ? 'var(--success)' : 'var(--error)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {c.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleEditClick(c)}
                      className={styles.actionLink}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
