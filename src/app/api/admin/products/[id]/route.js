import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    await connectDB();

    const product = await Product.findById(productId).populate('category').lean();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        _id: product._id.toString(),
        category: product.category ? { ...product.category, _id: product.category._id.toString() } : null,
        variants: product.variants.map((v) => ({ ...v, _id: v._id?.toString() })),
      },
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();

    const {
      name,
      slug,
      category,
      description,
      variants,
      images,
      featured,
      bestSeller,
      newArrival,
      productType,
      seoTitle,
      seoDescription,
    } = body;

    if (!name || !slug || !category || !description || !variants || variants.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing product details' }, { status: 400 });
    }

    await connectDB();

    // Verify slug uniqueness (excluding current product)
    const existing = await Product.findOne({ slug, _id: { $ne: productId } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Product slug already exists' }, { status: 400 });
    }

    const updated = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        category,
        description,
        variants,
        images: images || [],
        featured: !!featured,
        bestSeller: !!bestSeller,
        newArrival: !!newArrival,
        productType: productType || 'fresh meat',
        seoTitle: seoTitle || `${name} Fresh Cuts | Porville`,
        seoDescription: seoDescription || description,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error updating product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    await connectDB();

    const deleted = await Product.findByIdAndDelete(productId);

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting product' }, { status: 500 });
  }
}
