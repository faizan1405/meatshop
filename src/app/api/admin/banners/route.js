import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Banner from '@/models/Banner';
import { revalidateBannerPages } from '@/lib/adminRevalidate';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // createdAt tiebreaker keeps the order stable when banners share the
    // same displayOrder value (the default is 0).
    const banners = await Banner.find({}).sort({ displayOrder: 1, createdAt: 1 }).lean();

    return NextResponse.json({
      success: true,
      banners: banners.map((b) => ({
        ...b,
        _id: b._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error loading admin banners:', error);
    return NextResponse.json({ success: false, message: 'Server error loading banners' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bannerId, title, image, link, active, displayOrder, deleteBanner } = body;

    await connectDB();

    if (deleteBanner && bannerId) {
      const deleted = await Banner.findByIdAndDelete(bannerId);
      if (!deleted) {
        return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
      }
      revalidateBannerPages();
      return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
    }

    if (!title || !image) {
      return NextResponse.json({ success: false, message: 'Title and Image URL are required' }, { status: 400 });
    }

    // Guard against non-numeric input — parseInt('abc') is NaN and would
    // throw a cast error on save.
    const parsedOrder = parseInt(displayOrder, 10);
    const safeOrder = Number.isFinite(parsedOrder) ? parsedOrder : 0;

    if (bannerId) {
      // Edit
      const updated = await Banner.findByIdAndUpdate(
        bannerId,
        {
          title,
          image,
          link: link || '/shop',
          active: !!active,
          displayOrder: safeOrder,
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
      }
      revalidateBannerPages();
      return NextResponse.json({ success: true, message: 'Banner updated successfully' });
    } else {
      // Create
      await Banner.create({
        title,
        image,
        link: link || '/shop',
        active: !!active,
        displayOrder: safeOrder,
      });

      revalidateBannerPages();
      return NextResponse.json({ success: true, message: 'Banner created successfully' });
    }
  } catch (error) {
    console.error('Error saving banner:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error saving banner' }, { status: 500 });
  }
}
