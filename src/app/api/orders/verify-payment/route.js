import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRazorpayInstance } from '@/lib/razorpay';
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
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      cartItems,
      shippingAddress,
      couponCode,
      itemsSubtotal,
      discountAmount,
      deliveryCharge,
      orderTotal,
      isGuest,
      guestInfo,
      userEmail,
    } = body;

    // 1. Signature Verification
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Missing payment signature components' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, message: 'Razorpay secret not configured on server' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json({ success: false, message: 'Payment verification failed (invalid signature)' }, { status: 400 });
    }

    // 2. Create Order in MongoDB
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

    // SECURITY: bind the captured payment to the server-recomputed total.
    // The HMAC signature only proves the (order_id, payment_id) pair is authentic
    // — it does NOT prove how much was actually charged. Without this check a
    // tampered `cartItems` payload at verify time could create an order whose
    // recorded total differs from the amount truly paid via Razorpay. Compare the
    // server total against the amount locked into the Razorpay order at creation.
    const expectedAmountPaise = Math.round(serverOrderTotal * 100);
    try {
      const razorpay = getRazorpayInstance();
      const rpOrder = await razorpay.orders.fetch(razorpay_order_id);
      if (rpOrder && typeof rpOrder.amount === 'number' && rpOrder.amount !== expectedAmountPaise) {
        return NextResponse.json(
          { success: false, message: 'Payment amount mismatch. Order was not created.' },
          { status: 400 }
        );
      }
    } catch (gatewayErr) {
      // Gateway lookup failed (e.g. transient network error). The signature is
      // already cryptographically verified above, so we proceed rather than
      // reject a genuinely paid order — but log it for manual reconciliation.
      console.error('[verify-payment] Could not cross-check Razorpay order amount:', gatewayErr.message);
    }

    // Create the order document
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
      paymentStatus: 'paid',
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      orderStatus: 'confirmed', // Paid orders are immediately confirmed
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
      message: 'Payment verified and order created successfully',
      orderId: newOrder._id.toString(),
    });
  } catch (error) {
    console.error('Error verifying payment / creating order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error creating order' }, { status: 500 });
  }
}
