import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import { getSessionUser, resolveCartItems } from '@/lib/cart';

export const dynamic = 'force-dynamic';

// GET /api/cart — return the current logged-in user's cart, rehydrated from DB.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const cart = await Cart.findOne({ user: user._id }).lean();
    const { items } = await resolveCartItems(cart?.items || []);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ success: false, message: 'Server error fetching cart' }, { status: 500 });
  }
}

// PUT /api/cart — replace the user's cart with the provided items (full sync).
// Items are validated server-side; on_call/invalid items are dropped.
export async function PUT(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { canonical, items } = await resolveCartItems(body?.items || []);

    await connectDB();
    await Cart.findOneAndUpdate(
      { user: user._id },
      { $set: { items: canonical } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ success: false, message: 'Server error updating cart' }, { status: 500 });
  }
}

// DELETE /api/cart — clear the user's cart (used after a verified order).
export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Cart.findOneAndUpdate(
      { user: user._id },
      { $set: { items: [] } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, items: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ success: false, message: 'Server error clearing cart' }, { status: 500 });
  }
}
