import { NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';

export async function POST(request) {
  try {
    const { amount } = await request.json(); // Amount in INR

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment gateway configuration is missing on server.' 
      }, { status: 500 });
    }

    // Convert INR to Paise (e.g. ₹100 = 10000 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error creating order' }, { status: 500 });
  }
}
