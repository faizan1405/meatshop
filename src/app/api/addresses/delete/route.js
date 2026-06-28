import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Address from '@/models/Address';
import User from '@/models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { addressId } = await request.json();

    if (!addressId) {
      return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Securely delete only if the address belongs to this user
    const deleted = await Address.findOneAndDelete({ _id: addressId, user: user._id });

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Address not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting address' }, { status: 500 });
  }
}
