'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [message, setMessage] = useState(null);

  // Fetch products and categories on mount
  useEffect(() => {
    setIsLoading(true);
    
    // Fetch products
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));

    // Fetch categories
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setMessage({ type: 'success', text: 'Product deleted successfully.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete product.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error deleting product.' });
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.category?._id === categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className={styles.cardTitle} style={{ border: 'none', padding: 0, margin: 0 }}>
          Manage Fresh Cuts
        </h1>
        <Link href="/admin/products/new" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.85rem' }}>
          <Plus size={16} />
          <span>Add New Product</span>
        </Link>
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
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', border: '1px solid var(--border-cream)', borderRadius: '4px', padding: '6px 12px', backgroundColor: 'var(--bg-cream)' }}>
          <Search size={16} style={{ color: 'var(--text-dark-muted)' }} />
          <input
            type="text"
            placeholder="Search cuts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'none', width: '100%', padding: 0 }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div>Loading product catalog...</div>
      ) : filteredProducts.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: 'var(--text-dark-muted)', fontSize: '0.9rem' }}>
          No products match your filter criteria.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Variants (Qty)</th>
              <th>Price Range (₹)</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              // Find min and max price
              const prices = p.variants.map((v) => v.salePrice || v.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

              return (
                <tr key={p._id}>
                  <td>
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=60&q=80'}
                      alt={p.name}
                      style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-cream)' }}
                    />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.category?.name || 'Unassigned'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.productType}</td>
                  <td>
                    {p.variants.map((v) => `${v.name} (${v.stockQty})`).join(', ')}
                  </td>
                  <td><strong>{priceDisplay}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {p.featured && <span style={{ fontSize: '0.65rem', backgroundColor: '#e1f5fe', color: '#0277bd', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Featured</span>}
                      {p.bestSeller && <span style={{ fontSize: '0.65rem', backgroundColor: '#e8f5e9', color: '#1b5e20', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Best Seller</span>}
                      {p.newArrival && <span style={{ fontSize: '0.65rem', backgroundColor: '#f3e5f5', color: '#6a1b9a', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>New</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <Link href={`/admin/products/${p._id}/edit`} className={styles.actionLink} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit size={14} />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className={styles.actionLink}
                        style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
