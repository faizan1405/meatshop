import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Required for populate

export async function GET() {
  try {
    await connectDB();

    // Fetch 10 active products. Prefer featured or best sellers.
    const products = await Product.find({ isActive: true })
      .sort({ isFeatured: -1, isBestSeller: -1, createdAt: -1 })
      .limit(10)
      .populate('category', 'name slug')
      .select('name slug images placeholderImage category variants priceType purchaseMode isFeatured isBestSeller')
      .lean();

    return NextResponse.json({ success: true, products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Slideshow products error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
