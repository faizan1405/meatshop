import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { revalidateCategoryPages } from '@/lib/adminRevalidate';

/**
 * Re-number all categories to a clean 1..N sequence (sorted by their current
 * displayOrder, with createdAt as a stable tiebreaker for legacy docs that
 * share the same value, e.g. the old default of 0). Uses bulkWrite so the
 * whole normalization is a single round-trip.
 *
 * Returns the normalized, sorted list of categories (lean docs).
 */
async function normalizeCategoryOrder() {
  const categories = await Category.find({})
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const ops = [];
  categories.forEach((cat, index) => {
    const target = index + 1;
    if (cat.displayOrder !== target) {
      ops.push({
        updateOne: {
          filter: { _id: cat._id },
          update: { $set: { displayOrder: target } },
        },
      });
      cat.displayOrder = target;
    }
  });

  if (ops.length > 0) {
    await Category.bulkWrite(ops);
  }

  return categories;
}

/**
 * Move one category to a target 1-based position and shift every other
 * category accordingly, then persist a clean 1..N sequence via bulkWrite.
 */
async function moveCategoryToPosition(categoryId, targetPosition) {
  const categories = await Category.find({})
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const idStr = categoryId.toString();
  const currentIndex = categories.findIndex((c) => c._id.toString() === idStr);
  if (currentIndex === -1) return;

  const [moved] = categories.splice(currentIndex, 1);
  // Clamp to the valid range 1..N.
  const clamped = Math.min(Math.max(targetPosition, 1), categories.length + 1);
  categories.splice(clamped - 1, 0, moved);

  const ops = [];
  categories.forEach((cat, index) => {
    const target = index + 1;
    if (cat.displayOrder !== target) {
      ops.push({
        updateOne: {
          filter: { _id: cat._id },
          update: { $set: { displayOrder: target } },
        },
      });
    }
  });

  if (ops.length > 0) {
    await Category.bulkWrite(ops);
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    // Admin-only: this list includes inactive categories and is only consumed
    // by admin pages (category manager, product form dropdown).
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let categories = await Category.find({})
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    // Backfill/normalize legacy data: docs missing displayOrder, sharing
    // duplicate values (the old default of 0), or leaving gaps make the sort
    // ambiguous and position math unreliable — exactly the "reorder does not
    // stick" bug. Require the exact contiguous sequence 1..N.
    const needsNormalize = categories.some(
      (cat, index) => cat.displayOrder !== index + 1
    );

    if (needsNormalize) {
      categories = await normalizeCategoryOrder();
    }

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

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'A valid category ID is required' }, { status: 400 });
    }

    await connectDB();

    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // Close the gap left by the deleted category so the sequence stays 1..N.
    await normalizeCategoryOrder();
    revalidateCategoryPages();

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting category' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, name, slug, description, image, displayOrder, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: 'Name and slug are required' }, { status: 400 });
    }

    await connectDB();

    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');

    // Parse the requested position. Blank/invalid means "no explicit position":
    // keep the current position when editing, append to the end when creating.
    const parsedOrder = parseInt(displayOrder, 10);
    const hasExplicitOrder = Number.isFinite(parsedOrder) && parsedOrder > 0;

    if (categoryId) {
      // Edit mode
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 });
      }

      // Reject a slug that would collide with another category (the create
      // path already checks this; without it the edit path throws a raw
      // duplicate-key error).
      const slugClash = await Category.findOne({ slug: formattedSlug, _id: { $ne: categoryId } });
      if (slugClash) {
        return NextResponse.json({ success: false, message: 'Category slug already exists' }, { status: 400 });
      }

      // Update the editable fields WITHOUT touching displayOrder here — the
      // position change is handled by moveCategoryToPosition below so that
      // editing name/image/status never corrupts the ordering sequence.
      const updated = await Category.findByIdAndUpdate(
        categoryId,
        {
          name,
          slug: formattedSlug,
          description,
          image,
          isActive: isActive !== undefined ? !!isActive : true,
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
      }

      if (hasExplicitOrder && parsedOrder !== updated.displayOrder) {
        // Move to the requested position and shift the others (e.g. moving
        // position 1 → 9 pulls 2..9 up by one), then re-number 1..N.
        await moveCategoryToPosition(categoryId, parsedOrder);
      } else {
        // Still normalize so legacy duplicate/missing orders self-heal.
        await normalizeCategoryOrder();
      }

      revalidateCategoryPages();
      return NextResponse.json({ success: true, message: 'Category updated successfully' });
    } else {
      // Create mode
      const existing = await Category.findOne({ slug: formattedSlug });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Category slug already exists' }, { status: 400 });
      }

      const count = await Category.countDocuments({});
      const created = await Category.create({
        name,
        slug: formattedSlug,
        description,
        image: image || '',
        // New categories go to the end by default; an explicit position is
        // applied right after via the shared move helper.
        displayOrder: count + 1,
        isActive: isActive !== undefined ? !!isActive : true,
      });

      if (hasExplicitOrder && parsedOrder <= count) {
        await moveCategoryToPosition(created._id, parsedOrder);
      }

      revalidateCategoryPages();
      return NextResponse.json({ success: true, message: 'Category created successfully' });
    }
  } catch (error) {
    console.error('Error saving category:', error);
    // Duplicate key from the unique name/slug indexes — return a friendly
    // message instead of a raw Mongo E11000 error string.
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'A category with this name or slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error saving category' }, { status: 500 });
  }
}
