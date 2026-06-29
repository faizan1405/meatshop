import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import { getSessionUser, resolveCartItems, normalizeIncomingItems } from '@/lib/cart';

export const dynamic = 'force-dynamic';

// POST /api/cart/merge — merge guest (localStorage) items into the user's
// server cart once at login. Same product + same variant combine quantities;
// different variants stay as separate lines.
export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    await connectDB();
    const existing = await Cart.findOne({ user: user._id }).lean();

    // Combine the existing server cart with the incoming local cart, then let
    // resolveCartItems re-validate everything against the DB. normalizeIncomingItems
    // (called inside resolve) sums quantities for matching product+variant keys.
    const combined = [
      ...normalizeIncomingItems(existing?.items || []),
      ...normalizeIncomingItems(body?.items || []),
    ];

    const { canonical, items } = await resolveCartItems(combined);

    await Cart.findOneAndUpdate(
      { user: user._id },
      { $set: { items: canonical } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error merging cart:', error);
    return NextResponse.json({ success: false, message: 'Server error merging cart' }, { status: 500 });
  }
}
