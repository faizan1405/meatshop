'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import styles from './page.module.css';

export default function OrdersPage() {
  const { data: session, status } = useSession();
  
  // States
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Guest Tracking States
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  // Fetch logged in user orders
  useEffect(() => {
    if (session?.user) {
      setIsLoading(true);
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrders(data.orders);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  const handleTrackGuestOrder = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackedOrder(null);

    if (!trackOrderId.trim() || !trackPhone.trim()) {
      setTrackError('Please fill in both Order ID and Mobile number.');
      return;
    }

    setIsTracking(true);

    try {
      const res = await fetch(`/api/orders/track?orderId=${trackOrderId.trim()}&phone=${trackPhone.trim()}`);
      const data = await res.json();

      if (data.success) {
        setTrackedOrder(data.order);
      } else {
        setTrackError(data.message || 'Order not found matching details.');
      }
    } catch (err) {
      console.error(err);
      setTrackError('Failed to fetch tracking details. Please try again.');
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#ffe0b2', text: '#e65100' };
      case 'confirmed': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'preparing': return { bg: '#e1f5fe', text: '#0277bd' };
      case 'out_for_delivery': return { bg: '#f3e5f5', text: '#6a1b9a' };
      case 'delivered': return { bg: '#e8f5e9', text: '#1b5e20' };
      case 'cancelled': return { bg: '#ffebee', text: '#c62828' };
      default: return { bg: '#eeeeee', text: '#616161' };
    }
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.container}>
        <div className="container">
          <h1 className={styles.title}>Track Your Orders</h1>

          {/* 1. Logged In Orders History */}
          {session ? (
            <div>
              <h2 className={styles.cardTitle} style={{ marginBottom: '20px' }}>Your Order History</h2>
              
              {isLoading ? (
                <div>Loading orders...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--white)', border: '1px solid var(--border-cream)', borderRadius: 'var(--border-radius-md)' }}>
                  <ShoppingBag size={48} style={{ color: 'var(--text-dark-muted)', marginBottom: '15px' }} />
                  <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', color: 'var(--text-dark)' }}>No orders placed yet</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark-muted)' }}>Fresh cuts are waiting for your choice!</p>
                  <Link href="/shop" className="btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
                    Browse Shop
                  </Link>
                </div>
              ) : (
                orders.map((order) => {
                  const sColor = getStatusColor(order.orderStatus);
                  return (
                    <div key={order._id} className={styles.card}>
                      <div className={styles.orderHeader}>
                        <div className={styles.orderMeta}>
                          <span>ORDER ID: <strong className={styles.orderMetaValue} style={{ fontSize: '0.75rem' }}>{order._id}</strong></span>
                          <span>PLACED ON: <strong className={styles.orderMetaValue}>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></span>
                        </div>
                        <div className={styles.orderMeta}>
                          <span>TRACKING STATUS:</span>
                          <span className={styles.statusPill} style={{ backgroundColor: sColor.bg, color: sColor.text, alignSelf: 'flex-start', marginTop: '3px' }}>
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className={styles.orderMeta}>
                          <span>PAYMENT STATUS:</span>
                          <span style={{ fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className={styles.itemsList}>
                        {order.items.map((item) => (
                          <div key={item._id} className={styles.itemRow}>
                            <div className={styles.itemQtyName}>
                              {item.image && (
                                <div className={styles.itemImg}>
                                  <img src={item.image} alt={item.productName} />
                                </div>
                              )}
                              <span>{item.productName} ({item.variantName}) <strong>x{item.quantity}</strong></span>
                            </div>
                            <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className={styles.totalRow}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)' }}>
                          Delivering to: <strong>{order.shippingAddress.name} ({order.shippingAddress.phone})</strong>
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-dark-muted)' }}>Paid Amount: </span>
                          <span className={styles.totalPrice}>₹{order.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            
            /* 2. Guest Order Tracking Screen */
            <div style={{ maxWidth: '650px', margin: '0 auto' }}>
              <div className={styles.guestTrackCard}>
                <h2 className={styles.cardTitle} style={{ textAlign: 'center', marginBottom: '10px' }}>Track Guest Order</h2>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dark-muted)', marginBottom: '20px' }}>
                  Enter the Order ID and Phone Number from your checkout details to track the delivery progress.
                </p>

                <form onSubmit={handleTrackGuestOrder}>
                  <div className={styles.formGroup}>
                    <label>Order ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 64b8a..."
                      value={trackOrderId}
                      onChange={(e) => setTrackOrderId(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="10-digit number used during checkout"
                      value={trackPhone}
                      onChange={(e) => setTrackPhone(e.target.value)}
                      required
                    />
                  </div>

                  {trackError && (
                    <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '15px' }}>
                      {trackError}
                    </p>
                  )}

                  <button 
                    type="submit" 
                    className="btn-gold" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    disabled={isTracking}
                  >
                    {isTracking ? 'Searching...' : 'Track Delivery'}
                  </button>
                </form>
              </div>

              {/* Display Tracked Order Details */}
              {trackedOrder && (
                <div className={styles.card} style={{ borderTop: '2px solid var(--primary-gold)' }}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderMeta}>
                      <span>ORDER ID: <strong className={styles.orderMetaValue} style={{ fontSize: '0.75rem' }}>{trackedOrder._id}</strong></span>
                      <span>PLACED ON: <strong className={styles.orderMetaValue}>{new Date(trackedOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></span>
                    </div>
                    <div className={styles.orderMeta}>
                      <span>STATUS:</span>
                      <span className={styles.statusPill} style={{ backgroundColor: getStatusColor(trackedOrder.orderStatus).bg, color: getStatusColor(trackedOrder.orderStatus).text, alignSelf: 'flex-start', marginTop: '3px' }}>
                        {trackedOrder.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.itemsList}>
                    {trackedOrder.items.map((item) => (
                      <div key={item._id} className={styles.itemRow}>
                        <span>{item.productName} ({item.variantName}) <strong>x{item.quantity}</strong></span>
                        <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalRow}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dark-muted)' }}>
                      Shipping details: <strong>{trackedOrder.shippingAddress.name} ({trackedOrder.shippingAddress.phone})</strong>
                    </span>
                    <span className={styles.totalPrice}>Total paid: ₹{trackedOrder.totalPrice}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
