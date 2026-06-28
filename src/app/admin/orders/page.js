import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import styles from '../page.module.css';

async function getOrders() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    return orders.map((order) => ({
      _id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      shippingAddressName: order.shippingAddress.name,
      shippingAddressPhone: order.shippingAddress.phone,
      isGuest: order.isGuest,
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    redirect('/admin/login');
  }

  const orders = await getOrders();

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
    <div className={styles.card}>
      <h1 className={styles.cardTitle} style={{ border: 'none', padding: 0, marginBottom: '20px' }}>
        Manage Customer Orders
      </h1>

      {orders.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: 'var(--text-dark-muted)', fontSize: '0.9rem' }}>
          No customer orders found.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Date</th>
              <th>Payment Status</th>
              <th>Delivery Status</th>
              <th>Order Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const sColor = getStatusColor(order.orderStatus);
              return (
                <tr key={order._id}>
                  <td>
                    <strong style={{ fontSize: '0.75rem' }}>{order._id}</strong>
                  </td>
                  <td>{order.shippingAddressName}</td>
                  <td>{order.shippingAddressPhone}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: order.isGuest ? '#7e57c2' : '#0288d1' }}>
                      {order.isGuest ? 'Guest' : 'Customer'}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}</td>
                  <td>
                    <strong style={{ color: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--error)' }}>
                      {order.paymentStatus.toUpperCase()}
                    </strong>
                  </td>
                  <td>
                    <span 
                      className={styles.statusPill} 
                      style={{ backgroundColor: sColor.bg, color: sColor.text }}
                    >
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td><strong>₹{order.totalPrice}</strong></td>
                  <td>
                    <Link href={`/admin/orders/${order._id}`} className={styles.actionLink}>
                      Manage Order
                    </Link>
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
export const metadata = {
  title: "Admin Orders | Porville Panel",
};
