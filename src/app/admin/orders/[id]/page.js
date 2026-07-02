'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';
import styles from '../../page.module.css';

export default function AdminOrderDetailsPage({ params }) {
  const router = useRouter();
  const { id: orderId } = use(params);

  // States
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (orderId) {
      // Show the loading state while (re)fetching this order on orderId change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      fetch(`/api/admin/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrder(data.order);
            setOrderStatus(data.order.orderStatus);
            setPaymentStatus(data.order.paymentStatus);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [orderId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });

      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
        setMessage({ type: 'success', text: 'Order status updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update order.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error updating order.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div>Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className={styles.card}>
        <ShieldAlert size={36} style={{ color: 'var(--error)' }} />
        <h2 className={styles.cardTitle}>Order Not Found</h2>
        <p>We could not retrieve the details for order {orderId}.</p>
        <Link href="/admin/orders" className="btn-primary" style={{ display: 'inline-block', marginTop: '15px' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Back button */}
      <div>
        <Link href="/admin/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Back to Orders List</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Left Column: Order items and shipping address details */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Items */}
          <div className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Order Items</h2>
              {order.isDemoOrder && (
                <span style={{ fontSize: '0.75rem', backgroundColor: '#e3f2fd', color: '#1565c0', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>DEMO ORDER</span>
              )}
            </div>
            <div className={styles.table} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              {order.items.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-cream)', paddingBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{item.productName}</strong><br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark-muted)' }}>Variant: {item.variantName} x{item.quantity}</span>
                  </div>
                  <strong style={{ fontSize: '0.95rem' }}>₹{item.price * item.quantity}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Shipping & Customer Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <div><strong>Receiver Name:</strong> {order.shippingAddress.name}</div>
              <div><strong>Phone Number:</strong> {order.shippingAddress.phone}</div>
              <div>
                <strong>Street Address:</strong><br />
                {order.shippingAddress.streetAddress}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </div>
              {order.isGuest ? (
                <div><strong>Checkout Type:</strong> <span style={{ color: '#7e57c2', fontWeight: 700 }}>Guest Checkout</span></div>
              ) : (
                <div><strong>Checkout Type:</strong> <span style={{ color: '#0288d1', fontWeight: 700 }}>Registered Account</span></div>
              )}
              {order.isDemoOrder && (
                <>
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-cream)' }}>
                    <strong>Payment Method:</strong> {order.paymentMethod}
                  </div>
                  <div><strong>Payment Provider:</strong> {order.paymentProvider}</div>
                </>
              )}
            </div>
          </div>

          {/* Delivery timing */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Delivery Timing</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <div>
                <strong>Mode:</strong>{' '}
                {order.deliveryMode === 'READY_TO_EAT_2_HOURS'
                  ? 'Ready-to-eat (within 2 hours)'
                  : 'Raw items — fixed slot'}
              </div>
              {order.deliveryMode === 'READY_TO_EAT_2_HOURS' ? (
                <div><strong>Estimated Delivery:</strong> {order.deliveryEstimate || 'Within 2 hours'}</div>
              ) : (
                <>
                  <div><strong>Delivery Date:</strong> {order.deliveryDateLabel || order.deliveryDate || '—'}</div>
                  <div><strong>Delivery Slot:</strong> {order.deliverySlot?.label || '—'}</div>
                </>
              )}
              {order.deliveryNote && <div><strong>Note:</strong> {order.deliveryNote}</div>}
            </div>
          </div>

        </div>

        {/* Right Column: Order breakdown & status controls */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Order Totals */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Bill Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-dark-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>₹{order.itemsPrice}</span>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Discount</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Charge</span>
                <span>₹{order.deliveryCharge}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-cream)', paddingTop: '10px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                <span>Grand Total</span>
                <span>₹{order.totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Status modifiers form */}
          <div className={styles.card} style={{ borderTop: '2px solid var(--primary-gold)' }}>
            <h2 className={styles.cardTitle}>Manage Statuses</h2>
            
            {message && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', padding: '10px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '15px' }}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Delivery Tracking Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed / Paid</option>
                  <option value="preparing">Preparing Cuts</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered Successfully</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid Successfully</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-gold"
                style={{ width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center' }}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Update Status'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
