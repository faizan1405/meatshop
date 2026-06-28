import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Category from '@/models/Category';

export async function GET(request) {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ displayOrder: 1 }).lean();
    return NextResponse.json({
      success: true,
      categories: categories.map((cat) => ({
        ...cat,
        _id: cat._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error loading admin categories API:', error);
    return NextResponse.json({ success: false, message: 'Server error loading categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, name, slug, description, image, displayOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: 'Name and slug are required' }, { status: 400 });
    }

    await connectDB();

    const formattedSlug = slug.toLowerCase().replace(/\s+/g, '-');

    if (categoryId) {
      // Edit mode
      const updated = await Category.findByIdAndUpdate(
        categoryId,
        { name, slug: formattedSlug, description, image, displayOrder: parseInt(displayOrder || '0', 10) },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Category updated successfully' });
    } else {
      // Create mode
      const existing = await Category.findOne({ slug: formattedSlug });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Category slug already exists' }, { status: 400 });
      }

      await Category.create({
        name,
        slug: formattedSlug,
        description,
        image: image || '',
        displayOrder: parseInt(displayOrder || '0', 10),
      });

      return NextResponse.json({ success: true, message: 'Category created successfully' });
    }
  } catch (error) {
    console.error('Error saving category:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error saving category' }, { status: 500 });
  }
}
