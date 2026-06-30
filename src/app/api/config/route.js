import { NextResponse } from 'next/server';

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
                               
  return NextResponse.json({ 
    isGoogleConfigured, 
    isRazorpayConfigured,
    isDemoCheckoutEnabled
  });
}
