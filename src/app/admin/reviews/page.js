'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchReviews = () => {
    setIsLoading(true);
    fetch('/api/admin/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAction = async (id, action) => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this review?')) return;
    setMessage(null);

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, action }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        // Update local state list
        if (action === 'approve') {
          setReviews((prev) =>
            prev.map((r) => (r._id === id ? { ...r, approved: true } : r))
          );
        } else {
          setReviews((prev) => prev.filter((r) => r._id !== id));
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Action failed.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error executing action.' });
    }
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.cardTitle} style={{ border: 'none', padding: 0, marginBottom: '20px' }}>
        Moderate Cut Reviews
      </h1>

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

      {isLoading ? (
        <div>Loading reviews list...</div>
      ) : reviews.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: 'var(--text-dark-muted)' }}>
          No customer reviews left yet.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Author</th>
              <th>Product Cut</th>
              <th>Rating</th>
              <th>Review Comment</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((rev) => (
              <tr key={rev._id}>
                <td><strong>{rev.name}</strong></td>
                <td>
                  {rev.product ? (
                    <a href={`/product/${rev.product.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--primary-gold-dark)' }}>
                      {rev.product.name}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-dark-muted)' }}>Deleted Product</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '2px', color: 'var(--primary-gold)' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill={i < rev.rating ? "var(--primary-gold)" : "none"} stroke="none" />
                    ))}
                  </div>
                </td>
                <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  "{rev.comment}"
                </td>
                <td>{new Date(rev.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}</td>
                <td>
                  <span 
                    style={{ 
                      fontWeight: 700, 
                      color: rev.approved ? 'var(--success)' : 'var(--warning)',
                      fontSize: '0.75rem'
                    }}
                  >
                    {rev.approved ? 'APPROVED' : 'PENDING'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {!rev.approved && (
                      <button 
                        onClick={() => handleAction(rev._id, 'approve')}
                        className={styles.actionLink}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}
                      >
                        <ShieldCheck size={14} />
                        <span>Approve</span>
                      </button>
                    )}
                    <button 
                      onClick={() => handleAction(rev._id, 'delete')}
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
  );
}
