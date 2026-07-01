import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';
import { resolveDeliveryConfig } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isGoogleConfigured =
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes('your-google-client-id');

  const isRazorpayConfigured =
    !!process.env.RAZORPAY_KEY_ID &&
    !!process.env.RAZORPAY_KEY_SECRET &&
    !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    !process.env.RAZORPAY_KEY_ID.includes('yourkeyid');

  const isDemoCheckoutEnabled =
    process.env.NEXT_PUBLIC_DEMO_CHECKOUT_ENABLED === 'true' ||
    (process.env.NODE_ENV !== 'production' && !isRazorpayConfigured);

  // Delivery rule so the client cart shows the exact total the server bills.
  // Falls back to defaults if the DB is unreachable — checkout must never break
  // just because settings couldn't be read.
  let deliveryConfig = resolveDeliveryConfig(null);
  try {
    await connectDB();
    const settings = await SiteSettings.findOne({}).lean();
    deliveryConfig = resolveDeliveryConfig(settings);
  } catch (err) {
    console.error('Failed to load delivery config for /api/config', err);
  }

  return NextResponse.json({
    isGoogleConfigured,
    isRazorpayConfigured,
    isDemoCheckoutEnabled,
    deliveryCharge: deliveryConfig.deliveryCharge,
    freeDeliveryThreshold: deliveryConfig.freeDeliveryThreshold,
  });
}
