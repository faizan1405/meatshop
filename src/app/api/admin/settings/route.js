import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';

export async function GET(request) {
  try {
    await connectDB();

    let settings = await SiteSettings.findOne({}).lean();

    if (!settings) {
      // Create default if none exists
      settings = await SiteSettings.create({
        contactNumber: '9217577006',
        email: 'porville1986@gmail.com',
        address: 'D-1b/1028, Sangam Vihar-110080',
        deliveryNote: 'Express delivery within 2 hours. Minimum order value may apply.',
        deliveryCharge: 50,
        freeDeliveryThreshold: 500,
        whatsappNumber: '9217577006',
        facebookUrl: '',
        instagramUrl: '',
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        _id: settings._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ success: false, message: 'Server error loading settings' }, { status: 500 });
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
      contactNumber,
      email,
      address,
      deliveryNote,
      deliveryCharge,
      freeDeliveryThreshold,
      whatsappNumber,
      facebookUrl,
      instagramUrl,
    } = body;

    await connectDB();

    let settings = await SiteSettings.findOne({});

    const updateFields = {
      contactNumber,
      email,
      address,
      deliveryNote,
      deliveryCharge: parseFloat(deliveryCharge || '0'),
      freeDeliveryThreshold: parseFloat(freeDeliveryThreshold || '0'),
      whatsappNumber,
      facebookUrl,
      instagramUrl,
    };

    if (settings) {
      settings = await SiteSettings.findByIdAndUpdate(settings._id, updateFields, { new: true });
    } else {
      settings = await SiteSettings.create(updateFields);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error saving settings' }, { status: 500 });
  }
}
