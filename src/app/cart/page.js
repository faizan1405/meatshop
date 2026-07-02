'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/common/Providers';
import { variantPrice } from '@/lib/pricing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import styles from './page.module.css';

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    itemsSubtotal,
    discountAmount,
    deliveryCharge,
    orderTotal,
    coupon,
    deliveryDisabledForTesting,
    isMounted,
  } = useCart();

  if (!isMounted) return null;

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.cartContainer}>
        <div className="container">
          <h1 className={styles.title}>Your Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={64} strokeWidth={1} style={{ color: 'var(--text-dark-muted)' }} />
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', color: 'var(--text-dark)' }}>
                Your cart is empty
              </h2>
              <p>Add some fresh, high-quality premium cuts to your cart first.</p>
              <Link href="/shop" className="btn-primary" style={{ marginTop: '10px' }}>
                Shop Fresh Cuts
              </Link>
            </div>
          ) : (
            <div className={styles.cartLayout}>
              {/* Items List */}
              <div className={styles.cartItemsSection}>
                {cartItems.map((item) => {
                  const itemPrice = variantPrice(item.variant);
                  return (
                    <div key={`${item.product._id}-${item.variant.name}`} className={styles.itemCard}>
                      
                      {/* Image */}
                      <div className={styles.itemImg}>
                        <img 
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=150&q=80'} 
                          alt={item.product.name} 
                        />
                      </div>

                      {/* Info */}
                      <div className={styles.itemInfo}>
                        <Link href={`/product/${item.product.slug}`}>
                          <h3 className={styles.itemName}>{item.product.name}</h3>
                        </Link>
                        <span className={styles.itemMeta}>Category: {item.product.category?.name || 'Fresh Meat'}</span>
                        <span className={styles.itemMeta}>Variant: <strong>{item.variant.name}</strong></span>
                      </div>

                      {/* Qty & Price Controls */}
                      <div className={styles.itemControls}>
                        {/* Qty selector */}
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid var(--border-cream)',
                            borderRadius: 'var(--border-radius-sm)',
                            backgroundColor: 'var(--white)',
                          }}
                        >
                          <button
                            type="button"
                            style={{ padding: '6px 12px', fontWeight: 'bold' }}
                            onClick={() => updateQuantity(item.product._id, item.variant.name, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.product.name}`}
                          >
                            -
                          </button>
                          <span style={{ padding: '0 12px', fontWeight: '600', fontSize: '0.9rem' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            style={{ padding: '6px 12px', fontWeight: 'bold' }}
                            onClick={() => updateQuantity(item.product._id, item.variant.name, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.product.name}`}
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className={styles.price}>₹{itemPrice * item.quantity}</span>

                        {/* Remove */}
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.product._id, item.variant.name)}
                          title="Remove item"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Order Summary Side panel */}
              <div className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.summaryTitle}>Checkout Summary</h2>
                  
                  <div className={styles.row}>
                    <span>Items Subtotal</span>
                    <span>₹{itemsSubtotal}</span>
                  </div>

                  {coupon && (
                    <div className={styles.row} style={{ color: 'var(--success)' }}>
                      <span>Coupon Discount ({coupon.code})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  {/* Delivery row hidden while delivery is disabled for testing. */}
                  {!deliveryDisabledForTesting && (
                    <div className={styles.row}>
                      <span>Delivery Charges</span>
                      <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                    </div>
                  )}

                  <div className={styles.totalRow}>
                    <span>Estimated Total</span>
                    <span>₹{orderTotal}</span>
                  </div>

                  <Link href="/checkout" className={`${styles.checkoutBtn} btn-gold`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} />
                  </Link>

                  {!deliveryDisabledForTesting && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-muted)', textAlign: 'center', marginTop: '10px' }}>
                      Free delivery on orders above ₹770. Otherwise ₹40 applies.
                    </div>
                  )}

                  {/* Dev-only notice — not shown to real customers in production. */}
                  {deliveryDisabledForTesting && process.env.NODE_ENV !== 'production' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-muted)', textAlign: 'center', marginTop: '10px' }}>
                      Delivery temporarily disabled for testing.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
