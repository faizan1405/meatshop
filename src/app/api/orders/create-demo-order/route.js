import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Address from '@/models/Address';
import Coupon from '@/models/Coupon';
import SiteSettings from '@/models/SiteSettings';
import { computeDeliveryCharge } from '@/lib/delivery';

export async function POST(request) {
  try {
    const isRazorpayConfigured = 
      !!process.env.RAZORPAY_KEY_ID && 
      !!process.env.RAZORPAY_KEY_SECRET && 
      !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      !process.env.RAZORPAY_KEY_ID.includes('yourkeyid');

    const isDemoCheckoutEnabled = 
      process.env.NEXT_PUBLIC_DEMO_CHECKOUT_ENABLED === 'true' || 
      (process.env.NODE_ENV !== 'production' && !isRazorpayConfigured);

    if (!isDemoCheckoutEnabled) {
      return NextResponse.json({ success: false, message: 'Demo checkout is not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const {
      cartItems,
      shippingAddress,
      couponCode,
      isGuest,
      guestInfo,
      userEmail,
    } = body;

    await connectDB();

    let userId = null;
    if (!isGuest && userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        userId = user._id;
        
        // Also save this address for the user if it's new
        const existingAddress = await Address.findOne({
          user: userId,
          streetAddress: shippingAddress.streetAddress,
          postalCode: shippingAddress.postalCode,
        });

        if (!existingAddress) {
          await Address.create({
            user: userId,
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            streetAddress: shippingAddress.streetAddress,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country || 'India',
            isDefault: false,
          });
        }
      }
    }

    // Recalculate everything server-side using MongoDB to prevent client-side tampering
    let serverItemsSubtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const dbProduct = await Product.findById(item.product._id);
      if (!dbProduct) {
        return NextResponse.json({ success: false, message: `Product ${item.product.name} not found` }, { status: 400 });
      }

      if (dbProduct.priceType === 'on_call' || dbProduct.purchaseMode === 'on_call') {
        return NextResponse.json({ success: false, message: `Product ${dbProduct.name} is 'On call' and cannot be ordered online.` }, { status: 400 });
      }

      const variant = dbProduct.variants.find((v) => v.name === item.variant.name);
      if (!variant) {
        return NextResponse.json({ success: false, message: `Variant ${item.variant.name} not found for product ${dbProduct.name}` }, { status: 400 });
      }

      const activePrice = variant.salePrice || variant.price;
      serverItemsSubtotal += activePrice * item.quantity;

      orderItems.push({
        product: dbProduct._id,
        productName: dbProduct.name,
        variantName: variant.name,
        price: activePrice,
        quantity: item.quantity,
        image: dbProduct.images?.[0] || '',
      });
    }

    let serverDiscountAmount = 0;
    if (couponCode) {
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (dbCoupon && new Date() < new Date(dbCoupon.expiryDate)) {
        if (serverItemsSubtotal >= dbCoupon.minOrderValue) {
          if (dbCoupon.discountType === 'percentage') {
            serverDiscountAmount = (serverItemsSubtotal * dbCoupon.discountValue) / 100;
            if (dbCoupon.maxDiscountValue) {
              serverDiscountAmount = Math.min(serverDiscountAmount, dbCoupon.maxDiscountValue);
            }
          } else if (dbCoupon.discountType === 'flat') {
            serverDiscountAmount = dbCoupon.discountValue;
          }
        }
      }
    }

    const settings = await SiteSettings.findOne({});
    const serverDeliveryCharge = computeDeliveryCharge(serverItemsSubtotal, settings);
    const serverOrderTotal = Math.max(serverItemsSubtotal - serverDiscountAmount + serverDeliveryCharge, 0);

    // Create the demo order document
    const newOrder = await Order.create({
      user: userId,
      isGuest,
      guestInfo: isGuest ? guestInfo : null,
      items: orderItems,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        streetAddress: shippingAddress.streetAddress,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
      },
      itemsPrice: serverItemsSubtotal,
      deliveryCharge: serverDeliveryCharge,
      discountAmount: serverDiscountAmount,
      totalPrice: serverOrderTotal,
      couponUsed: couponCode || null,
      paymentStatus: 'paid', // Mark as paid for testing
      isDemoOrder: true,
      paymentMethod: 'Demo',
      paymentProvider: 'demo',
      paymentDetails: {
        razorpayOrderId: 'demo_order_' + Date.now(),
        razorpayPaymentId: 'demo_pay_' + Date.now(),
        razorpaySignature: 'demo_signature',
      },
      orderStatus: 'confirmed',
    });

    // 3. Decrement product variant stock quantities
    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      if (product) {
        const variantIndex = product.variants.findIndex((v) => v.name === item.variant.name);
        if (variantIndex > -1) {
          const qtyRemaining = Math.max(0, product.variants[variantIndex].stockQty - item.quantity);
          product.variants[variantIndex].stockQty = qtyRemaining;
          if (qtyRemaining === 0) {
            product.variants[variantIndex].stockStatus = 'out_of_stock';
          }
          await product.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo order created successfully',
      orderId: newOrder._id.toString(),
    });
  } catch (error) {
    console.error('Error creating demo order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error creating demo order' }, { status: 500 });
  }
}
