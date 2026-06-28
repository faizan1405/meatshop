import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Address from '@/models/Address';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const addresses = await Address.find({ user: user._id }).sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      addresses: addresses.map((addr) => ({
        _id: addr._id.toString(),
        name: addr.name,
        phone: addr.phone,
        streetAddress: addr.streetAddress,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault,
      })),
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ success: false, message: 'Server error fetching addresses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, streetAddress, city, state, postalCode, country } = body;

    if (!name || !phone || !streetAddress || !city || !state || !postalCode) {
      return NextResponse.json({ success: false, message: 'Missing address fields' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // If this is the first address, make it default
    const count = await Address.countDocuments({ user: user._id });

    const newAddress = await Address.create({
      user: user._id,
      name,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: count === 0,
    });

    return NextResponse.json({
      success: true,
      address: {
        _id: newAddress._id.toString(),
        name: newAddress.name,
        phone: newAddress.phone,
        streetAddress: newAddress.streetAddress,
        city: newAddress.city,
        state: newAddress.state,
        postalCode: newAddress.postalCode,
        country: newAddress.country,
        isDefault: newAddress.isDefault,
      },
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ success: false, message: 'Server error creating address' }, { status: 500 });
  }
}
