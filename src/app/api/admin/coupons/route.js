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
        expiryDate: c.expiryDate.toISOString(),
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

    await connectDB();

    const formattedCode = code.toUpperCase().trim();

    if (couponId) {
      // Edit
      const updated = await Coupon.findByIdAndUpdate(
        couponId,
        {
          code: formattedCode,
          discountType,
          discountValue: parseFloat(discountValue),
          minOrderValue: parseFloat(minOrderValue || '0'),
          maxDiscountValue: maxDiscountValue ? parseFloat(maxDiscountValue) : undefined,
          active: !!active,
          expiryDate: new Date(expiryDate),
        },
        { new: true }
      );
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
        code: formattedCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: parseFloat(minOrderValue || '0'),
        maxDiscountValue: maxDiscountValue ? parseFloat(maxDiscountValue) : undefined,
        active: !!active,
        expiryDate: new Date(expiryDate),
      });

      return NextResponse.json({ success: true, message: 'Coupon created successfully' });
    }
  } catch (error) {
    console.error('Error saving coupon:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error saving coupon' }, { status: 500 });
  }
}
