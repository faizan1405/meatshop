import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const phone = searchParams.get('phone');

    if (!orderId || !phone) {
      return NextResponse.json({ success: false, message: 'Missing Order ID or Phone number' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: 'Invalid Order ID format' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({
      _id: orderId,
      'shippingAddress.phone': phone.trim(),
    }).lean();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order details not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        items: order.items.map(item => ({ ...item, _id: item._id.toString(), product: item.product.toString() })),
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    console.error('Error tracking guest order:', error);
    return NextResponse.json({ success: false, message: 'Server error tracking order' }, { status: 500 });
  }
}
