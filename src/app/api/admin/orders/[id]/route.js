import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    await connectDB();

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map(item => ({ ...item, _id: item._id.toString(), product: item.product.toString() })),
      },
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
    const body = await request.json();
    const { orderStatus, paymentStatus } = body;

    if (!orderStatus || !paymentStatus) {
      return NextResponse.json({ success: false, message: 'Missing status parameters' }, { status: 400 });
    }

    await connectDB();

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus, paymentStatus },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        ...updatedOrder,
        _id: updatedOrder._id.toString(),
        createdAt: updatedOrder.createdAt.toISOString(),
        items: updatedOrder.items.map(item => ({ ...item, _id: item._id.toString(), product: item.product.toString() })),
      },
    });
  } catch (error) {
    console.error('Error updating admin order details:', error);
    return NextResponse.json({ success: false, message: 'Server error updating order' }, { status: 500 });
  }
}
