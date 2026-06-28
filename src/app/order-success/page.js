import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ShieldAlert } from 'lucide-react';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import styles from './page.module.css';

async function getOrder(orderId) {
  if (!orderId) return null;
  try {
    await connectDB();
    const order = await Order.findById(orderId).lean();
    if (!order) return null;
    return {
      ...order,
      _id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({ ...item, _id: item._id.toString(), product: item.product.toString() })),
    };
  } catch (error) {
    console.error('Error fetching order for success page:', error);
    return null;
  }
}

export default async function OrderSuccessPage({ searchParams }) {
  const { orderId } = await searchParams;
  const order = await getOrder(orderId);

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.container}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          {order ? (
            <div className={styles.card}>
              <div className={styles.iconWrapper}>
                <CheckCircle2 size={48} />
              </div>
              <h1 className={styles.title}>Order Confirmed!</h1>
              <p className={styles.message}>
                Thank you for shopping with Porville. Your payment has been verified, and your order has been placed successfully. Our master butchers are preparing your fresh cuts.
              </p>

              {/* Order summary table */}
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Order ID</span>
                  <span className={styles.detailValue} style={{ fontSize: '0.8rem' }}>{order._id}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Delivery Address</span>
                  <span className={styles.detailValue} style={{ textAlign: 'right' }}>
                    {order.shippingAddress.name}<br />
                    {order.shippingAddress.streetAddress}, {order.shippingAddress.city}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Payment Method</span>
                  <span className={styles.detailValue}>Razorpay NetBanking/Card</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Payment Status</span>
                  <span className={styles.detailValue} style={{ color: 'var(--success)', textTransform: 'uppercase' }}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total Amount Paid</span>
                  <span className={styles.detailValue} style={{ color: 'var(--primary-gold-dark)', fontSize: '1rem' }}>
                    ₹{order.totalPrice}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)' }}>
                An order receipt and delivery details have been sent to you. Average delivery time: <strong>2 Hours</strong>.
              </p>

              <div className={styles.buttons}>
                <Link href="/orders" className="btn-primary">
                  Track Orders
                </Link>
                <Link href="/shop" className="btn-gold">
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.iconWrapper} style={{ color: 'var(--error)', backgroundColor: '#ffebee', borderColor: '#ffcdd2' }}>
                <ShieldAlert size={48} />
              </div>
              <h1 className={styles.title}>Order Not Found</h1>
              <p className={styles.message}>
                We could not locate the details of this order. If your payment was deducted, please check your profile order history or contact support.
              </p>
              <div className={styles.buttons}>
                <Link href="/orders" className="btn-primary">
                  Go to My Orders
                </Link>
                <Link href="/" className="btn-gold">
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export const metadata = {
  title: "Order Confirmed | Porville",
  description: "Thank you for shopping with Porville. Your order was successfully received and confirmed.",
};
