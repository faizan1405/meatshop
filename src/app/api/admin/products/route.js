import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const products = await Product.find({}).populate('category').sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      products: products.map((p) => ({
        ...p,
        _id: p._id.toString(),
        category: p.category ? { ...p.category, _id: p.category._id.toString() } : null,
        variants: p.variants.map((v) => ({ ...v, _id: v._id?.toString() })),
      })),
    });
  } catch (error) {
    console.error('Error loading admin products:', error);
    return NextResponse.json({ success: false, message: 'Server error loading products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      category,
      description,
      variants,
      images,
      media,
      featured,
      bestSeller,
      newArrival,
      isActive,
      productType,
      unitType,
      seoTitle,
      seoDescription,
    } = body;

    if (!name || !slug || !category || !description || !variants || variants.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing product details' }, { status: 400 });
    }

    const isOnCall = unitType === 'on_call';

    // Price safeguard: fixed-price products must never be saved with a 0/empty
    // price. Only "on call" products are allowed to omit prices.
    if (!isOnCall) {
      const invalid = variants.some((v) => !(Number(v.price) > 0));
      if (invalid) {
        return NextResponse.json(
          { success: false, message: 'Every variant needs a price greater than 0, or set the unit type to "On call".' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Verify slug uniqueness
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Product slug already exists' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      category,
      description,
      variants,
      images: images || [],
      media: media || [],
      featured: !!featured,
      bestSeller: !!bestSeller,
      newArrival: !!newArrival,
      isActive: isActive !== undefined ? !!isActive : true,
      productType: productType || 'fresh meat',
      unitType: unitType || 'pack_weight',
      priceType: isOnCall ? 'on_call' : 'fixed',
      purchaseMode: isOnCall ? 'on_call' : 'cart',
      seoTitle: seoTitle || `${name} Fresh Cuts | Porville`,
      seoDescription: seoDescription || description,
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      productId: product._id.toString(),
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error creating product' }, { status: 500 });
  }
}
