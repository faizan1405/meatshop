import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order, { PAYMENT_METHODS } from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Address from '@/models/Address';
import Coupon from '@/models/Coupon';
import SiteSettings from '@/models/SiteSettings';
import { variantPrice } from '@/lib/pricing';
import { calculateCartTotals } from '@/lib/cartTotals';
import { validateDeliverySelection } from '@/lib/deliverySlots';

// ---------------------------------------------------------------------------
// Cash on Delivery (COD) order creation.
//
// Unlike the online flow this never touches Razorpay: there is no order to
// create at the gateway and no signature to verify. The order is written
// directly to MongoDB using the SAME server-recomputed products, prices,
// discount, delivery fee, address and delivery selection as the online flow —
// the browser's totals are ignored entirely. The only differences from a paid
// online order are the payment metadata (method = cod, status = pending) and
// that no paymentDetails / stock behaviour changes beyond the shared decrement.
// ---------------------------------------------------------------------------
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      cartItems,
      shippingAddress,
      couponCode,
      deliveryDate,
      deliverySlot,
      isGuest,
      guestInfo,
      userEmail,
      paymentMethod,
    } = body;

    // --- Validate payment method against the allowed enum (never trust client) ---
    if (!PAYMENT_METHODS.includes(paymentMethod) || paymentMethod !== 'cod') {
      return NextResponse.json(
        { success: false, message: 'Invalid payment method for Cash on Delivery order.' },
        { status: 400 }
      );
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or empty cart' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.streetAddress) {
      return NextResponse.json({ success: false, message: 'A valid shipping address is required.' }, { status: 400 });
    }

    // Idempotency key generated once per checkout attempt by the client. Used to
    // collapse duplicate submissions (rapid clicks / retries) into one order.
    const idempotencyKey =
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.trim()
        ? body.idempotencyKey.trim()
        : '';

    await connectDB();

    // Fast-path duplicate guard: if an order already exists for this key, return
    // it instead of creating another. The unique sparse index below is the
    // authoritative race-safe guard.
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey }).lean();
      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'Order already placed',
          orderId: existing._id.toString(),
        });
      }
    }

    let userId = null;
    if (!isGuest && userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        userId = user._id;

        // Also save this address for the user if it's new (same behaviour as
        // the online flow, so COD customers build up their address book too).
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
    const orderItems = [];
    const itemsForTotals = [];
    const deliveryItems = [];

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

      if (!(variantPrice(variant) > 0)) {
        return NextResponse.json({ success: false, message: `Product ${dbProduct.name} does not have a valid price.` }, { status: 400 });
      }

      // variantPrice() is the single source of truth — ignores 0/inverted sale prices.
      const activePrice = variantPrice(variant);
      itemsForTotals.push({ variant, quantity: item.quantity });
      // Classify from the DB product (authoritative) for delivery-mode checks.
      deliveryItems.push({ productType: dbProduct.productType, name: dbProduct.name });

      orderItems.push({
        product: dbProduct._id,
        productName: dbProduct.name,
        variantName: variant.name,
        price: activePrice,
        quantity: item.quantity,
        image: dbProduct.images?.[0] || '',
      });
    }

    // Re-validate the delivery selection server-side and derive what to store.
    // Identical rules to the online flow — delivery timeline/slot logic untouched.
    const delivery = validateDeliverySelection({ items: deliveryItems, deliveryDate, deliverySlot });
    if (!delivery.valid) {
      return NextResponse.json({ success: false, message: delivery.error }, { status: 400 });
    }

    // Resolve an active, unexpired coupon; discount/delivery/total computed centrally.
    let activeCoupon = null;
    if (couponCode) {
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (dbCoupon && new Date() < new Date(dbCoupon.expiryDate)) {
        activeCoupon = dbCoupon;
      }
    }

    const settings = await SiteSettings.findOne({});
    // Same shared totals util as the cart UI, online order creation and payment
    // verification — subtotal, discount, delivery fee and grand total match exactly.
    const {
      subtotal: serverItemsSubtotal,
      discount: serverDiscountAmount,
      deliveryCharge: serverDeliveryCharge,
      total: serverOrderTotal,
    } = calculateCartTotals({ items: itemsForTotals, settings, coupon: activeCoupon });

    if (serverOrderTotal <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order total' }, { status: 400 });
    }

    // Create the COD order document. Payment is collected on delivery, so:
    //   paymentMethod  = 'cod'
    //   paymentStatus  = 'pending'  (unpaid until collected)
    //   orderStatus    = 'confirmed' (order placed/accepted — same status the
    //                    online flow records for a successfully placed order)
    const orderPayload = {
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
      // Delivery timing (server-validated) — identical to the online flow.
      deliveryMode: delivery.mode,
      deliveryDate: delivery.deliveryDate || null,
      deliveryDateLabel: delivery.deliveryDateLabel || '',
      deliverySlot: delivery.deliverySlot || null,
      deliveryEstimate: delivery.deliveryEstimate || '',
      deliveryNote: delivery.deliveryNote || '',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      paymentProvider: 'cod',
      orderStatus: 'confirmed',
    };
    if (idempotencyKey) {
      orderPayload.idempotencyKey = idempotencyKey;
    }

    let newOrder;
    try {
      newOrder = await Order.create(orderPayload);
    } catch (createErr) {
      // Race-safe duplicate guard: two near-simultaneous submits with the same
      // idempotency key — the unique index rejects the second one. Return the
      // already-created order rather than surfacing an error / creating a dup.
      if (createErr?.code === 11000 && idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey }).lean();
        if (existing) {
          return NextResponse.json({
            success: true,
            message: 'Order already placed',
            orderId: existing._id.toString(),
          });
        }
      }
      throw createErr;
    }

    // Decrement product variant stock quantities — same logic as the online flow.
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
      message: 'Cash on Delivery order placed successfully',
      orderId: newOrder._id.toString(),
    });
  } catch (error) {
    console.error('Error creating COD order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error creating order' }, { status: 500 });
  }
}
