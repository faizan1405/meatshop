'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, ShoppingCart, CheckCircle, ShieldAlert } from 'lucide-react';
import { useCart } from '../common/Providers';
import { getPricingInfo, variantPrice } from '@/lib/pricing';
import styles from './ProductDetailClient.module.css';

export default function ProductDetailClient({ product, initialReviews }) {
  const { data: session } = useSession();
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [activeMediaType, setActiveMediaType] = useState('image'); // 'image' | 'video'
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Review Form States
  const [reviews, setReviews] = useState(initialReviews || []);
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState(null); // 'success', 'error', 'submitting'

  // Hydrate initial states
  useEffect(() => {
    if (product) {
      if (product.variants?.length > 0) {
        const instock = product.variants.find((v) => v.stockStatus === 'in_stock');
        setSelectedVariant(instock || product.variants[0]);
      }
      if (product.images?.length > 0) {
        setActiveImage(product.images[0]);
      }
    }
  }, [product]);

  // Sync reviewer name if session changes
  useEffect(() => {
    if (session?.user?.name) {
      setReviewerName(session.user.name);
    }
  }, [session]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (selectedVariant) {
      addToCart(product, selectedVariant, quantity);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerName || !comment) {
      setReviewStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setReviewStatus({ type: 'submitting' });

    try {
      const res = await fetch('/api/reviews/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          name: reviewerName,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setReviewStatus({
          type: 'success',
          message: 'Thank you! Your review has been submitted and is pending administrator approval.',
        });
        setComment('');
        // If logged in, restore name
        if (session?.user?.name) {
          setReviewerName(session.user.name);
        } else {
          setReviewerName('');
        }
        setRating(5);
      } else {
        setReviewStatus({ type: 'error', message: data.message || 'Failed to submit review.' });
      }
    } catch (err) {
      console.error(err);
      setReviewStatus({ type: 'error', message: 'Failed to connect to server.' });
    }
  };

  const isOutOfStock = selectedVariant?.stockStatus === 'out_of_stock';
  const price = Number(selectedVariant?.price) || 0;
  const salePrice = Number(selectedVariant?.salePrice) || 0;
  const hasDiscount = salePrice > 0 && salePrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - salePrice) / price) * 100) : 0;

  // Single source of truth for on-call vs. priced. Falls back to "On call"
  // whenever there is no real price, so ₹0 never reaches the customer.
  const pricing = getPricingInfo(product);
  const isOnCall = pricing.isOnCall;
  const displayPrice = variantPrice(selectedVariant) > 0 ? variantPrice(selectedVariant) : pricing.minPrice;

  // Calculate average rating
  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div style={{ padding: '40px 0' }}>
      
      {/* 1. Gallery & Info Split */}
      <div className={styles.container}>
        
        {/* Gallery Panel */}
        <div className={styles.gallery}>
          {/* Main viewer */}
          <div className={styles.mainImage}>
            {activeMediaType === 'video' ? (
              <video
                key={activeVideoUrl}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              >
                <source src={activeVideoUrl} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={activeImage || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80'}
                alt={product.name}
              />
            )}
          </div>

          {/* Thumbnails row: images + video thumbnails */}
          {(product.images?.length > 1 || product.media?.length > 0) && (
            <div className={styles.thumbnails}>
              {product.images?.map((img, idx) => (
                <button
                  key={`img-${idx}`}
                  onClick={() => { setActiveImage(img); setActiveMediaType('image'); }}
                  className={`${styles.thumbnail} ${activeMediaType === 'image' && activeImage === img ? styles.thumbnailActive : ''}`}
                >
                  <img src={img} alt={`thumbnail-${idx}`} />
                </button>
              ))}
              {product.media?.filter((m) => m.type === 'video').map((m, idx) => (
                <button
                  key={`vid-${idx}`}
                  onClick={() => { setActiveVideoUrl(m.url); setActiveMediaType('video'); }}
                  className={`${styles.thumbnail} ${activeMediaType === 'video' && activeVideoUrl === m.url ? styles.thumbnailActive : ''}`}
                  title="Play video"
                  style={{ position: 'relative' }}
                >
                  <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '18px', color: '#fff', textShadow: '0 0 4px #000' }}>▶</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Panel */}
        <div className={styles.info}>
          <div>
            <span className={styles.categoryTag}>{product.category?.name || 'Fresh Cuts'}</span>
            <h1 className={styles.title}>{product.name}</h1>
          </div>

          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={16} 
                  fill={i < Math.round(Number(averageRating)) ? "var(--primary-gold)" : "none"} 
                  stroke={i < Math.round(Number(averageRating)) ? "none" : "var(--primary-gold)"} 
                />
              ))}
            </div>
            <span>{averageRating} / 5.0 ({reviews.length} Customer Reviews)</span>
          </div>

          {/* Price display */}
          <div className={styles.priceRow}>
            {isOnCall ? (
              <span className={styles.price}>On call</span>
            ) : hasDiscount ? (
              <>
                <span className={styles.price} style={{ color: 'var(--primary-gold-dark)' }}>₹{salePrice}</span>
                <span className={styles.oldPrice}>₹{price}</span>
                <span className={styles.saveBadge}>SAVE {discountPercent}%</span>
              </>
            ) : (
              <span className={styles.price}>₹{displayPrice}</span>
            )}
          </div>

          {/* Description */}
          <div className={styles.description}>
            <p>{product.description}</p>
          </div>

          {/* Variant Selector */}
          {product.variants?.length > 1 && (
            <div className={styles.variantSection}>
              <span className={styles.sectionLabel}>Select weight / portions:</span>
              <div className={styles.variantPills}>
                {product.variants.map((v) => {
                  const isActive = selectedVariant?.name === v.name;
                  const vOutOfStock = v.stockStatus === 'out_of_stock';
                  return (
                    <button
                      key={v._id || v.name}
                      onClick={() => !vOutOfStock && setSelectedVariant(v)}
                      className={`${styles.variantPill} ${isActive ? styles.variantPillActive : ''} ${vOutOfStock ? styles.variantPillOutOfStock : ''}`}
                      disabled={vOutOfStock}
                    >
                      {v.name} {vOutOfStock ? '(Sold Out)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Purchase details */}
          {isOnCall ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className={styles.purchaseSection}>
                <a 
                  href="tel:9217577006" 
                  className="btn-gold btn-primary" 
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    textDecoration: 'none', 
                    padding: '14px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                >
                  Call to Order (9217577006)
                </a>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary-gold-dark)', fontWeight: 600 }}>
                This product is available for order by phone only. Please contact us directly to place your order.
              </div>
            </div>
          ) : (
            <div className={styles.purchaseSection}>
              <div className={styles.qtySelector}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {isOutOfStock ? (
                <button className="btn-primary" style={{ flex: 1, cursor: 'not-allowed' }} disabled>
                  Out of Stock
                </button>
              ) : (
                <button onClick={handleAddToCart} className="btn-gold btn-primary" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dark-muted)' }}>
            <div>Availability: <strong style={{ color: isOutOfStock ? 'var(--error)' : 'var(--success)' }}>{isOutOfStock ? 'Out of stock' : 'In Stock'}</strong></div>
            <div>Processing: <strong>Freshly sliced, vacuum packed immediately</strong></div>
            <div>Delivery Note: <strong>Chilled home delivery in 2 hours across Sangam Vihar</strong></div>
          </div>
        </div>

      </div>

      {/* 2. Reviews Section */}
      <div className={styles.reviewsContainer}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', color: 'var(--text-dark)' }}>Customer Feedback</h2>
        
        <div className={styles.reviewsLayout}>
          
          {/* Reviews List */}
          <div className={styles.reviewsList}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-dark-muted)', fontStyle: 'italic', padding: '20px 0' }}>
                No reviews yet. Be the first to share your experience with this cut!
              </p>
            ) : (
              reviews.map((rev, index) => (
                <div key={index} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <h4 className={styles.reviewerName}>{rev.name}</h4>
                    <span className={styles.reviewDate}>{new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className={styles.stars} style={{ marginBottom: '10px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < rev.rating ? "var(--primary-gold)" : "none"} 
                        stroke={i < rev.rating ? "none" : "var(--primary-gold)"} 
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>

          {/* Add Review Form */}
          <div className={styles.reviewForm}>
            <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', borderBottom: '1px solid var(--border-cream)', paddingBottom: '10px' }}>
              Add a Review
            </h3>

            {reviewStatus?.type === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--success)', padding: '10px 0' }}>
                <CheckCircle size={32} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{reviewStatus.message}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className={styles.formGroup}>
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    value={reviewerName} 
                    onChange={(e) => setReviewerName(e.target.value)} 
                    placeholder="Enter your name"
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Rating</label>
                  <div className={styles.starsInput}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={styles.starBtn}
                        onClick={() => setRating(val)}
                        aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
                        aria-pressed={val <= rating}
                      >
                        <Star
                          size={22}
                          className={styles.starSelectable}
                          fill={val <= rating ? "var(--primary-gold)" : "none"}
                          stroke="var(--primary-gold)"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Your Review</label>
                  <textarea 
                    rows="4" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder="Tell us about the texture, freshness, taste, and packaging..."
                    className={styles.formTextarea}
                    required
                  />
                </div>

                {reviewStatus?.type === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontSize: '0.85rem' }}>
                    <ShieldAlert size={16} />
                    <span>{reviewStatus.message}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-gold" 
                  disabled={reviewStatus?.type === 'submitting'}
                  style={{ display: 'flex', justifyContent: 'center' }}
                >
                  {reviewStatus?.type === 'submitting' ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
