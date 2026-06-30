import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadImage, uploadMedia } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { file, folder, resourceType } = await request.json();

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file data received' }, { status: 400 });
    }

    let result;
    if (resourceType === 'video' || file.startsWith('data:video/')) {
      result = await uploadMedia(file, folder || 'porville', 'video');
    } else {
      result = await uploadImage(file, folder || 'porville');
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType || 'image',
    });
  } catch (error) {
    console.error('Cloudinary upload route error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Upload failed' }, { status: 500 });
  }
}
