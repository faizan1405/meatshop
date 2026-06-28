import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IndianRupee, ShoppingCart, Users, Clock, ClipboardList } from 'lucide-react';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import styles from './page.module.css';

async function getDashboardStats() {
  try {
    await connectDB();

    // 1. Total Orders
    const totalOrders = await Order.countDocuments({});

    // 2. Total Revenue (sum of all paid orders)
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    // 3. Total Customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Pending Orders
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });

    // 5. Recent 5 Orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      stats: {
        totalOrders,
        totalRevenue,
        totalCustomers,
        pendingOrders,
      },
      recentOrders: recentOrders.map((order) => ({
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        shippingAddressName: order.shippingAddress.name,
      })),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      stats: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, pendingOrders: 0 },
      recentOrders: [],
    };
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    redirect('/admin/login');
  }

  const { stats, recentOrders } = await getDashboardStats();

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
    <div>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', marginBottom: '25px' }}>Dashboard Overview</h1>

      {/* Stats Cards Row */}
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Revenue</span>
            <span className={styles.statValue}>₹{stats.totalRevenue}</span>
          </div>
          <div className={styles.statIcon}>
            <IndianRupee size={24} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Orders</span>
            <span className={styles.statValue}>{stats.totalOrders}</span>
          </div>
          <div className={styles.statIcon}>
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Customers</span>
            <span className={styles.statValue}>{stats.totalCustomers}</span>
          </div>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pending Orders</span>
            <span className={styles.statValue}>{stats.pendingOrders}</span>
          </div>
          <div className={styles.statIcon} style={{ color: 'var(--warning)', backgroundColor: 'rgba(239, 108, 0, 0.1)' }}>
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Latest Orders section */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className={styles.cardTitle} style={{ margin: 0, border: 'none', padding: 0 }}>Latest Customer Orders</h2>
          <Link href="/admin/orders" className={styles.actionLink} style={{ fontSize: '0.85rem' }}>
            View All Orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--text-dark-muted)', fontSize: '0.9rem' }}>
            No orders placed yet.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Delivery Status</th>
                <th>Total Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const sColor = getStatusColor(order.orderStatus);
                return (
                  <tr key={order._id}>
                    <td>
                      <strong style={{ fontSize: '0.75rem' }}>{order._id}</strong>
                    </td>
                    <td>{order.shippingAddressName}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}</td>
                    <td>
                      <span 
                        style={{ 
                          fontWeight: 700, 
                          color: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--error)' 
                        }}
                      >
                        {order.paymentStatus}
                      </span>
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
                        Edit Status
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
