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
        deliveryNote: 'Free delivery on orders above ₹770. Otherwise ₹40 delivery charge applies.',
        deliveryCharge: 40,
        freeDeliveryThreshold: 770,
        whatsappNumber: '9217577006',
        facebookUrl: '',
        instagramUrl: '',
        logoUrl: '',
        fssaiRefNo: '30260223123490898',
        fssaiLicenseName: 'Vishal Kumar',
        fssaiAddress: 'Sangam Vihar, New Delhi, TIGRI, SAKET, South, Delhi, 110080',
        fssaiKindOfBusiness: 'Trade/Retail - Wholesaler, Distributor, Retailer; Manufacturer - Meat processing units, Fish and Fish Products',
        fssaiAppDate: '23-02-2026',
        fssaiNote: '',
      });
    }

    // GET is public (customer site needs business info). Whitelist only
    // public-safe fields — never spread the raw doc, which would leak
    // internal _id / __v / timestamps.
    //
    // Privacy: private FSSAI certificate fields (license holder name,
    // certificate address, kind-of-business metadata) must NOT reach the
    // public client. Only the registration reference number, registration
    // date, and an admin-authored display note are public-safe.
    const publicSettings = {
      contactNumber: settings.contactNumber,
      email: settings.email,
      address: settings.address,
      deliveryNote: settings.deliveryNote,
      deliveryCharge: settings.deliveryCharge,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      whatsappNumber: settings.whatsappNumber,
      facebookUrl: settings.facebookUrl,
      instagramUrl: settings.instagramUrl,
      logoUrl: settings.logoUrl,
      fssaiRefNo: settings.fssaiRefNo,
      fssaiAppDate: settings.fssaiAppDate,
      fssaiNote: settings.fssaiNote,
    };

    // Private FSSAI certificate fields are returned ONLY when an admin
    // explicitly requests the admin scope (?scope=admin) — i.e. the admin
    // settings form. The default response is fully sanitized for EVERYONE,
    // including a logged-in admin who is browsing the public site, so public
    // components (Header/Footer/About) never receive private certificate data.
    const scope = new URL(request.url).searchParams.get('scope');

    if (scope === 'admin') {
      const session = await getServerSession(authOptions);
      if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({
        success: true,
        settings: {
          ...publicSettings,
          fssaiLicenseName: settings.fssaiLicenseName,
          fssaiAddress: settings.fssaiAddress,
          fssaiKindOfBusiness: settings.fssaiKindOfBusiness,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: publicSettings,
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
      logoUrl,
      fssaiRefNo,
      fssaiLicenseName,
      fssaiAddress,
      fssaiKindOfBusiness,
      fssaiAppDate,
      fssaiNote,
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
      logoUrl,
      fssaiRefNo,
      fssaiLicenseName,
      fssaiAddress,
      fssaiKindOfBusiness,
      fssaiAppDate,
      fssaiNote,
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
