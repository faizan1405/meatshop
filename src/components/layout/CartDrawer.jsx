'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../common/Providers';
import DeliveryThresholdBar from '../common/DeliveryThresholdBar';
import { variantPrice } from '@/lib/pricing';
import { getCartDeliveryMode, DELIVERY_MODE } from '@/lib/deliverySlots';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    coupon,
    setCoupon,
    itemsSubtotal,
    discountAmount,
    deliveryCharge,
    orderTotal,
    freeDeliveryThreshold,
    deliveryDisabledForTesting,
    isMounted,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isMounted) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setCouponError('');

    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.toUpperCase()}&subtotal=${itemsSubtotal}`);
      const data = await res.json();

      if (data.success) {
        setCoupon(data.coupon);
        setCouponCode('');
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error(err);
      setCouponError('Failed to validate coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`${styles.overlay} ${isCartOpen ? styles.overlayOpen : ''}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sliding Drawer */}
      <div className={`${styles.drawer} ${isCartOpen ? styles.drawerOpen : ''}`}>
        
        {/* Drawer Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary-gold)' }} />
            <h2 className={styles.title}>Your Cart ({cartItems.length})</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className={styles.closeBtn} aria-label="Close cart">
            <X size={24} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className={styles.content}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <ShoppingBag size={48} style={{ color: 'var(--text-dark-muted)', strokeWidth: 1 }} />
              <h3 className={styles.emptyTitle}>Your cart is empty</h3>
              <p style={{ fontSize: '0.85rem' }}>Add fresh cuts to start your pure standards culinary experience.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="btn-primary"
                style={{ marginTop: '10px' }}
              >
                Shop Now
              </button>
            </div>
          ) : (
            <div className={styles.cartList}>
              {cartItems.map((item) => {
                const itemPrice = variantPrice(item.variant);
                return (
                  <div key={`${item.product._id}-${item.variant.name}`} className={styles.cartItem}>
                    
                    {/* Item Image */}
                    <div className={styles.itemImg}>
                      <img 
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=150&q=80'} 
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Item Details */}
                    <div className={styles.itemDetails}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 className={styles.itemName}>{item.product.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.product._id, item.variant.name)}
                            className={styles.removeBtn}
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className={styles.itemMeta}>Variant: {item.variant.name}</span>
                      </div>

                      <div className={styles.itemPriceQty}>
                        <span className={styles.price}>₹{itemPrice}</span>
                        
                        {/* Qty Controls */}
                        <div className={styles.qtyControls}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.product._id, item.variant.name, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.product.name}`}
                          >
                            -
                          </button>
                          <span className={styles.qtyVal}>{item.quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.product._id, item.variant.name, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              {/* Coupon Section */}
              <div className={styles.couponSection}>
                {coupon ? (
                  <div className={styles.couponApplied}>
                    <span>Coupon <strong>{coupon.code}</strong> Applied! (-₹{discountAmount})</span>
                    <button className={styles.couponRemove} onClick={handleRemoveCoupon}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                      Have a coupon code?
                    </label>
                    <div className={styles.couponForm}>
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className={styles.couponInput}
                      />
                      <button 
                        type="submit" 
                        className={styles.couponApplyBtn}
                        disabled={isValidating}
                      >
                        {isValidating ? '...' : 'APPLY'}
                      </button>
                    </div>
                    {couponError && (
                      <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '5px' }}>
                        {couponError}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{itemsSubtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className={styles.summaryRow} style={{ color: 'var(--success)' }}>
                <span>Coupon Discount</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            {/* Delivery row + threshold note hidden while delivery is disabled
                for payment testing. Re-enabling delivery restores them. */}
            {!deliveryDisabledForTesting && (
              <div className={styles.summaryRow}>
                <span>Delivery Charges</span>
                <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>Estimated Total</span>
              <span>₹{orderTotal}</span>
            </div>

            {/* Free-delivery progress — threshold/charge come from admin settings.
                Hides itself when the threshold is 0 (e.g. during delivery testing). */}
            <DeliveryThresholdBar subtotal={itemsSubtotal} freeDeliveryThreshold={freeDeliveryThreshold} />

            {/* Delivery timing hint (raw slot vs ready-to-eat). */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dark-muted)', textAlign: 'center', padding: '2px 0 4px' }}>
              {getCartDeliveryMode(cartItems).mode === DELIVERY_MODE.READY_TO_EAT_2_HOURS
                ? 'Ready-to-eat items delivered within 2 hours.'
                : 'Delivery slot will be selected at checkout.'}
            </div>

            {/* Dev-only notice — only while delivery is disabled for testing. */}
            {deliveryDisabledForTesting && process.env.NODE_ENV !== 'production' && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dark-muted)', textAlign: 'center', padding: '6px 0 2px' }}>
                Delivery temporarily disabled for testing.
              </div>
            )}

            <Link
              href="/checkout"
              className="btn-gold"
              style={{
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onClick={() => setIsCartOpen(false)}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

      </div>
    </>
  );
}
