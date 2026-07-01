import { NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import SiteSettings from '@/models/SiteSettings';
import { computeDeliveryCharge } from '@/lib/delivery';

export async function POST(request) {
  try {
    const { cartItems, couponCode } = await request.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or empty cart' }, { status: 400 });
    }

    await connectDB();

    // 1. Calculate subtotal and check for "On call" products
    let itemsSubtotal = 0;
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

      const activePrice = variant.salePrice || variant.price;
      if (activePrice === undefined || activePrice === null || activePrice <= 0) {
        return NextResponse.json({ success: false, message: `Product ${dbProduct.name} does not have a valid price.` }, { status: 400 });
      }

      itemsSubtotal += activePrice * item.quantity;
    }

    // 2. Validate coupon and calculate discount amount
    let discountAmount = 0;
    if (couponCode) {
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (dbCoupon && new Date() < new Date(dbCoupon.expiryDate)) {
        if (itemsSubtotal >= dbCoupon.minOrderValue) {
          if (dbCoupon.discountType === 'percentage') {
            discountAmount = (itemsSubtotal * dbCoupon.discountValue) / 100;
            if (dbCoupon.maxDiscountValue) {
              discountAmount = Math.min(discountAmount, dbCoupon.maxDiscountValue);
            }
          } else if (dbCoupon.discountType === 'flat') {
            discountAmount = dbCoupon.discountValue;
          }
        }
      }
    }

    // 3. Get Site Settings for delivery charge (shared rule; same as the cart UI)
    const settings = await SiteSettings.findOne({});
    const deliveryCharge = computeDeliveryCharge(itemsSubtotal, settings);

    // 4. Calculate final order total
    const orderTotal = Math.max(itemsSubtotal - discountAmount + deliveryCharge, 0);

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
