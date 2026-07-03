import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Coupon from '@/models/Coupon';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      coupons: coupons.map((c) => ({
        ...c,
        _id: c._id.toString(),
        expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error('Error loading admin coupons:', error);
    return NextResponse.json({ success: false, message: 'Server error loading coupons' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required' }, { status: 400 });
    }

    await connectDB();

    const deleted = await Coupon.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting coupon' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { couponId, code, discountType, discountValue, minOrderValue, maxDiscountValue, active, expiryDate } = body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return NextResponse.json({ success: false, message: 'Missing discount parameters' }, { status: 400 });
    }

    // Validate the discount definition before touching the database.
    if (!['percentage', 'flat'].includes(discountType)) {
      return NextResponse.json({ success: false, message: 'Invalid discount type' }, { status: 400 });
    }

    const parsedValue = parseFloat(discountValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return NextResponse.json({ success: false, message: 'Discount value must be a number greater than 0' }, { status: 400 });
    }
    if (discountType === 'percentage' && parsedValue > 100) {
      return NextResponse.json({ success: false, message: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    const parsedMinOrder = parseFloat(minOrderValue);
    const safeMinOrder = Number.isFinite(parsedMinOrder) && parsedMinOrder >= 0 ? parsedMinOrder : 0;

    const parsedMaxDiscount = maxDiscountValue !== undefined && maxDiscountValue !== null && maxDiscountValue !== ''
      ? parseFloat(maxDiscountValue)
      : null;
    if (parsedMaxDiscount !== null && (!Number.isFinite(parsedMaxDiscount) || parsedMaxDiscount <= 0)) {
      return NextResponse.json({ success: false, message: 'Maximum discount limit must be a number greater than 0' }, { status: 400 });
    }

    // The admin picks a plain calendar date (YYYY-MM-DD). Interpreting that as
    // UTC midnight would expire the coupon early in the morning IST on its
    // last day — extend a date-only value to end-of-day IST instead.
    const parsedExpiry = /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
      ? new Date(`${expiryDate}T23:59:59.999+05:30`)
      : new Date(expiryDate);
    if (Number.isNaN(parsedExpiry.getTime())) {
      return NextResponse.json({ success: false, message: 'Invalid expiry date' }, { status: 400 });
    }

    await connectDB();

    const formattedCode = code.toUpperCase().trim();

    const couponFields = {
      code: formattedCode,
      discountType,
      discountValue: parsedValue,
      minOrderValue: safeMinOrder,
      active: !!active,
      expiryDate: parsedExpiry,
    };

    if (couponId) {
      // Edit — reject a code that would collide with another coupon.
      const codeClash = await Coupon.findOne({ code: formattedCode, _id: { $ne: couponId } });
      if (codeClash) {
        return NextResponse.json({ success: false, message: 'Coupon code already exists' }, { status: 400 });
      }

      // A cleared max-discount field must actually REMOVE the stored cap.
      // (Passing undefined is stripped by Mongoose and silently kept the old
      // value, so admins could never remove the limit.)
      const update = parsedMaxDiscount !== null
        ? { $set: { ...couponFields, maxDiscountValue: parsedMaxDiscount } }
        : { $set: couponFields, $unset: { maxDiscountValue: '' } };

      const updated = await Coupon.findByIdAndUpdate(couponId, update, { new: true, runValidators: true });
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Coupon updated successfully' });
    } else {
      // Create
      const existing = await Coupon.findOne({ code: formattedCode });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Coupon code already exists' }, { status: 400 });
      }

      await Coupon.create({
        ...couponFields,
        ...(parsedMaxDiscount !== null ? { maxDiscountValue: parsedMaxDiscount } : {}),
      });

      return NextResponse.json({ success: true, message: 'Coupon created successfully' });
    }
  } catch (error) {
    console.error('Error saving coupon:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, message: 'Coupon code already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error saving coupon' }, { status: 500 });
  }
}
