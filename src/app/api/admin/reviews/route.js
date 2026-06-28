import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const reviews = await Review.find({})
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        ...r,
        _id: r._id.toString(),
        product: r.product ? { _id: r.product._id.toString(), name: r.product.name, slug: r.product.slug } : null,
      })),
    });
  } catch (error) {
    console.error('Error loading admin reviews:', error);
    return NextResponse.json({ success: false, message: 'Server error loading reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, action } = body; // action = 'approve' or 'delete'

    if (!reviewId || !action) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    await connectDB();

    if (action === 'approve') {
      const updated = await Review.findByIdAndUpdate(reviewId, { approved: true }, { new: true });
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Review approved successfully' });
    } else if (action === 'delete') {
      const deleted = await Review.findByIdAndDelete(reviewId);
      if (!deleted) {
        return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Review deleted successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error moderating review:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error moderating review' }, { status: 500 });
  }
}
