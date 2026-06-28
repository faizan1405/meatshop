import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, name, rating, comment } = body;

    if (!productId || !name || !rating || !comment) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    await connectDB();

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Create review - default to approved: false for moderation
    const review = await Review.create({
      product: productId,
      name,
      rating,
      comment,
      approved: false, // Moderated by admin
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted for moderation successfully',
      review: {
        _id: review._id.toString(),
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        approved: review.approved,
      },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, message: 'Server error during submission' }, { status: 500 });
  }
}
