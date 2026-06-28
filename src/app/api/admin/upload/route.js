import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { file, folder } = await request.json();

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file data received' }, { status: 400 });
    }

    // upload image to Cloudinary (returns secure_url and public_id)
    const result = await uploadImage(file, folder || 'porville');

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Cloudinary upload route error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Image upload failed' }, { status: 500 });
  }
}
