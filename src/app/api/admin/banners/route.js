import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Banner from '@/models/Banner';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const banners = await Banner.find({}).sort({ displayOrder: 1 }).lean();

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
      await Banner.findByIdAndDelete(bannerId);
      return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
    }

    if (!title || !image) {
      return NextResponse.json({ success: false, message: 'Title and Image URL are required' }, { status: 400 });
    }

    if (bannerId) {
      // Edit
      const updated = await Banner.findByIdAndUpdate(
        bannerId,
        {
          title,
          image,
          link: link || '/shop',
          active: !!active,
          displayOrder: parseInt(displayOrder || '0', 10),
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Banner not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Banner updated successfully' });
    } else {
      // Create
      await Banner.create({
        title,
        image,
        link: link || '/shop',
        active: !!active,
        displayOrder: parseInt(displayOrder || '0', 10),
      });

      return NextResponse.json({ success: true, message: 'Banner created successfully' });
    }
  } catch (error) {
    console.error('Error saving banner:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error saving banner' }, { status: 500 });
  }
}
