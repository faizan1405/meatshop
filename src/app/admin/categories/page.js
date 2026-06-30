'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Auto slug
  useEffect(() => {
    if (!editingId && name) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
    }
  }, [name, editingId]);

  const fetchCategories = () => {
    setIsLoading(true);
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCategories();
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
          body: JSON.stringify({ file: reader.result, folder: 'categories' }),
        });
        const data = await res.json();
        if (data.success) {
          setImage(data.url);
          setMessage({ type: 'success', text: 'Category image uploaded to Cloudinary!' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Image upload failed.' });
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to upload image.' });
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This cannot be undone.')) return;
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== id));
        setMessage({ type: 'success', text: 'Category deleted successfully.' });
        if (editingId === id) handleReset();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete category.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error deleting category.' });
    }
  };

  const handleEditClick = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setDisplayOrder(cat.displayOrder?.toString() || '0');
    setIsActive(cat.isActive !== false);
    setMessage(null);
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setDisplayOrder('0');
    setIsActive(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: editingId,
          name,
          slug,
          description,
          image,
          displayOrder,
          isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingId ? 'Category updated successfully!' : 'Category created successfully!' });
        handleReset();
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save category.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error saving category.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* 1. Left Side: Category Form */}
      <div style={{ flex: '1 1 300px' }}>
        <form onSubmit={handleSubmit} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 className={styles.cardTitle} style={{ border: 'none', padding: 0, margin: 0 }}>
            {editingId ? 'Modify Category' : 'Create Category'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category Name</label>
            <input
              type="text"
              placeholder="e.g. Quail"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Slug URL</label>
            <input
              type="text"
              placeholder="quail"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
            <textarea
              rows="3"
              placeholder="Describe this category cuts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status</label>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              style={{
                padding: '10px 14px',
                borderRadius: '4px',
                border: '1px solid var(--border-cream)',
                backgroundColor: 'var(--white)'
              }}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category Image</label>
            {image && (
              <img 
                src={image} 
                alt="category-preview" 
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-cream)' }} 
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

      {/* 2. Right Side: Category List Table */}
      <div style={{ flex: '2 1 500px' }} className={styles.card}>
        <h2 className={styles.cardTitle}>Store Categories List</h2>
        
        {isLoading ? (
          <div>Loading Categories...</div>
        ) : categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <img 
                      src={cat.image || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=60&q=80'} 
                      alt={cat.name} 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-cream)' }}
                    />
                  </td>
                  <td><strong>{cat.name}</strong></td>
                  <td>{cat.slug}</td>
                  <td>{cat.displayOrder}</td>
                  <td>
                    <span 
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: cat.isActive !== false ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                        color: cat.isActive !== false ? 'var(--success)' : 'var(--error)',
                        border: `1px solid ${cat.isActive !== false ? 'rgba(46, 125, 50, 0.2)' : 'rgba(198, 40, 40, 0.2)'}`
                      }}
                    >
                      {cat.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleEditClick(cat)}
                        className={styles.actionLink}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
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
