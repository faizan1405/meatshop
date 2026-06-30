import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Coupon from '@/models/Coupon';

const DEFAULT_COUPONS = [
  { code: 'WELCOME10',  discountType: 'percentage', discountValue: 10, minOrderValue: 400, maxDiscountValue: 100 },
  { code: 'PORVILLE10', discountType: 'percentage', discountValue: 10, minOrderValue: 770, maxDiscountValue: 200 },
  { code: 'FRESH10',    discountType: 'percentage', discountValue: 10, minOrderValue: 770, maxDiscountValue: 200 },
  { code: 'CHICKEN10',  discountType: 'percentage', discountValue: 10, minOrderValue: 770, maxDiscountValue: 200 },
  { code: 'MEAT10',     discountType: 'percentage', discountValue: 10, minOrderValue: 770, maxDiscountValue: 200 },
];

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const results = [];

    for (const def of DEFAULT_COUPONS) {
      const existing = await Coupon.findOne({ code: def.code });
      if (existing) {
        results.push({ code: def.code, action: 'skipped (already exists)' });
      } else {
        await Coupon.create({ ...def, active: true, expiryDate });
        results.push({ code: def.code, action: 'created' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Coupon seed error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
