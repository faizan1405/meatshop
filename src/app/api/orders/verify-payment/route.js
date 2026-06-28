import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Address from '@/models/Address';

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

    // Map cart items to order items schema format
    const orderItems = cartItems.map((item) => ({
      product: item.product._id,
      productName: item.product.name,
      variantName: item.variant.name,
      price: item.variant.salePrice || item.variant.price,
      quantity: item.quantity,
      image: item.product.images?.[0] || '',
    }));

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
      itemsPrice: itemsSubtotal,
      deliveryCharge,
      discountAmount,
      totalPrice: orderTotal,
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
