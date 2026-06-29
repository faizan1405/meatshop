import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User profile not found' }, { status: 404 });
    }

    // Match orders owned by this account, plus any prior guest orders placed
    // with the same email so they surface in history after the user logs in.
    const orders = await Order.find({
      $or: [
        { user: user._id },
        { isGuest: true, 'guestInfo.email': session.user.email },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        items: order.items.map(item => ({ ...item, _id: item._id.toString(), product: item.product.toString() })),
        shippingAddress: order.shippingAddress,
      })),
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json({ success: false, message: 'Server error loading orders' }, { status: 500 });
  }
}
