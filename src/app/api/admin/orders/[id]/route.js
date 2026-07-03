import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

// Keep in sync with the Order schema enums — findByIdAndUpdate does NOT run
// schema validators by default, so without this whitelist any string could be
// persisted as a status.
const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

// Serialize an order for the admin client, guarding legacy/partial docs so a
// single malformed order can't 500 the endpoint.
function serializeOrder(order) {
  return {
    ...order,
    _id: order._id.toString(),
    createdAt: order.createdAt ? order.createdAt.toISOString() : null,
    items: (order.items || []).map((item) => ({
      ...item,
      _id: item._id ? item._id.toString() : undefined,
      product: item.product ? item.product.toString() : null,
    })),
  };
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: serializeOrder(order),
    });
  } catch (error) {
    console.error('Error fetching admin order details:', error);
    return NextResponse.json({ success: false, message: 'Server error loading order details' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { orderStatus, paymentStatus } = body;

    if (!orderStatus || !paymentStatus) {
      return NextResponse.json({ success: false, message: 'Missing status parameters' }, { status: 400 });
    }

    if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid order status value' }, { status: 400 });
    }

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid payment status value' }, { status: 400 });
    }

    await connectDB();

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus, paymentStatus },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: serializeOrder(updatedOrder),
    });
  } catch (error) {
    console.error('Error updating admin order details:', error);
    return NextResponse.json({ success: false, message: 'Server error updating order' }, { status: 500 });
  }
}
