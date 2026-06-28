import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/models/Coupon';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();
    const subtotal = parseFloat(searchParams.get('subtotal') || '0');

    if (!code) {
      return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    await connectDB();

    const coupon = await Coupon.findOne({ code, active: true });

    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid coupon code' }, { status: 404 });
    }

    // Check expiry date
    if (new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ success: false, message: 'This coupon has expired' }, { status: 400 });
    }

    // Check minimum order value
    if (subtotal < coupon.minOrderValue) {
      return NextResponse.json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscountValue: coupon.maxDiscountValue,
      },
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ success: false, message: 'Server error during validation' }, { status: 500 });
  }
}
