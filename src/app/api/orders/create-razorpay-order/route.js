import { NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import SiteSettings from '@/models/SiteSettings';
import { variantPrice } from '@/lib/pricing';
import { calculateCartTotals } from '@/lib/cartTotals';

export async function POST(request) {
  try {
    const { cartItems, couponCode } = await request.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or empty cart' }, { status: 400 });
    }

    await connectDB();

    // 1. Validate items and build the priced line list. Price each line via
    //    variantPrice() (single source of truth) so a 0/inverted sale price can
    //    never inflate the amount — this is what caused a ₹1 item to charge ₹10.
    const itemsForTotals = [];
    for (const item of cartItems) {
      const dbProduct = await Product.findById(item.product._id);
      if (!dbProduct) {
        return NextResponse.json({ success: false, message: `Product not found` }, { status: 400 });
      }

      if (dbProduct.priceType === 'on_call' || dbProduct.purchaseMode === 'on_call') {
        return NextResponse.json({ success: false, message: `Product ${dbProduct.name} is 'On call' and cannot be ordered online.` }, { status: 400 });
      }

      const variant = dbProduct.variants.find(v => v.name === item.variant.name);
      if (!variant) {
        return NextResponse.json({ success: false, message: `Variant ${item.variant.name} not found for product ${dbProduct.name}` }, { status: 400 });
      }

      if (!(variantPrice(variant) > 0)) {
        return NextResponse.json({ success: false, message: `Product ${dbProduct.name} does not have a valid price.` }, { status: 400 });
      }

      itemsForTotals.push({ variant, quantity: item.quantity });
    }

    // 2. Resolve an active, unexpired coupon (discount math is handled centrally).
    let activeCoupon = null;
    if (couponCode) {
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (dbCoupon && new Date() < new Date(dbCoupon.expiryDate)) {
        activeCoupon = dbCoupon;
      }
    }

    // 3. Totals via the shared util — same subtotal/discount/delivery rule as the
    //    cart UI. Delivery is currently disabled for payment testing (fee = 0).
    const settings = await SiteSettings.findOne({});
    const { total: orderTotal } = calculateCartTotals({
      items: itemsForTotals,
      settings,
      coupon: activeCoupon,
    });

    if (orderTotal <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order total' }, { status: 400 });
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
      amount: Math.round(orderTotal * 100),
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
    // Razorpay SDK auth/validation errors carry their detail in error.error.description,
    // not error.message — surface it so misconfigured/inactive live keys are diagnosable.
    const rzpDescription = error?.error?.description;
    console.error('Error creating Razorpay order:', rzpDescription || error?.message || error);
    return NextResponse.json(
      { success: false, message: rzpDescription || error?.message || 'Server error creating order' },
      { status: 500 }
    );
  }
}
