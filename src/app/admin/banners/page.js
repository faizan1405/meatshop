'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('/shop');
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');

  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchBanners = () => {
    setIsLoading(true);
    fetch('/api/admin/banners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBanners(data.banners);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, folder: 'banners' }),
        });
        const data = await res.json();
        if (data.success) {
          setImage(data.url);
          setMessage({ type: 'success', text: 'Banner image uploaded successfully!' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Image upload failed.' });
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Error uploading image.' });
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleEditClick = (b) => {
    setEditingId(b._id);
    setTitle(b.title);
    setImage(b.image);
    setLink(b.link || '/shop');
    setActive(b.active);
    setDisplayOrder(b.displayOrder?.toString() || '0');
    setMessage(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    setMessage(null);

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId: id, deleteBanner: true }),
      });
      const data = await res.json();

      if (data.success) {
        setBanners((prev) => prev.filter((b) => b._id !== id));
        setMessage({ type: 'success', text: 'Banner deleted successfully.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete banner.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error deleting banner.' });
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setTitle('');
    setImage('');
    setLink('/shop');
    setActive(true);
    setDisplayOrder('0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannerId: editingId,
          title,
          image,
          link,
          active,
          displayOrder,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingId ? 'Banner updated successfully!' : 'Banner created successfully!' });
        handleReset();
        fetchBanners();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save banner.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error saving banner.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Form */}
      <div style={{ flex: '1 1 300px' }}>
        <form onSubmit={handleSubmit} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 className={styles.cardTitle} style={{ border: 'none', padding: 0, margin: 0 }}>
            {editingId ? 'Modify Banner' : 'Create Banner'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Banner Heading / Title</label>
            <input
              type="text"
              placeholder="e.g. Fresh Chicken Cuts 15% Off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Link URL (Redirect path)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/shop or /category/chicken"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Banner Image</label>
            {image && (
              <img 
                src={image} 
                alt="banner-preview" 
                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-cream)' }} 
              />
            )}
            <label 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px dashed var(--primary-gold)',
                padding: '8px 15px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer',
                width: 'fit-content',
                backgroundColor: 'var(--bg-cream)'
              }}
            >
              <UploadCloud size={16} />
              <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <label htmlFor="active" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Banner is Active
            </label>
          </div>

          {message && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', fontSize: '0.8rem' }}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn-gold" style={{ flex: 1, display: 'flex', justifyContent: 'center' }} disabled={isSaving || isUploading}>
              {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleReset} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Table */}
      <div style={{ flex: '2 1 500px' }} className={styles.card}>
        <h2 className={styles.cardTitle}>Homepage Promotion Banners</h2>
        
        {isLoading ? (
          <div>Loading banners...</div>
        ) : banners.length === 0 ? (
          <p>No banners found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Link</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b._id}>
                  <td>
                    <img 
                      src={b.image} 
                      alt={b.title} 
                      style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-cream)' }}
                    />
                  </td>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.link}</td>
                  <td>{b.displayOrder}</td>
                  <td>
                    <span 
                      style={{ 
                        fontWeight: 700, 
                        color: b.active ? 'var(--success)' : 'var(--error)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {b.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleEditClick(b)}
                        className={styles.actionLink}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(b._id)}
                        className={styles.actionLink}
                        style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
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
