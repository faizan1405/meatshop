import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  variantName: {
    type: String, // e.g., '500g'
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
});

const ShippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
});

// Chosen raw-item delivery slot (null for ready-to-eat-only orders).
const DeliverySlotSchema = new mongoose.Schema(
  {
    label: { type: String },      // e.g. '9:00 AM – 12:00 PM'
    startTime: { type: String },  // 'HH:MM' 24h
    endTime: { type: String },    // 'HH:MM' 24h
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Null for guests
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestInfo: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    items: [OrderItemSchema],
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    itemsPrice: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    couponUsed: {
      type: String, // Coupon code used
    },
    // ---- Delivery timing (added for item-type-based delivery) ----
    // Optional with a safe default so older orders keep working untouched.
    deliveryMode: {
      type: String,
      enum: ['RAW_SLOT', 'READY_TO_EAT_2_HOURS'],
      default: 'RAW_SLOT',
    },
    deliveryDate: {
      type: String, // 'YYYY-MM-DD' civil date (IST). Null for ready-to-eat.
      default: null,
    },
    deliveryDateLabel: {
      type: String, // e.g. 'Monday, 15 July'
      default: '',
    },
    deliverySlot: {
      type: DeliverySlotSchema,
      default: null,
    },
    deliveryEstimate: {
      type: String, // e.g. 'Within 2 hours' (ready-to-eat orders)
      default: '',
    },
    deliveryNote: {
      type: String, // e.g. mixed-cart note
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDetails: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
    },
    isDemoOrder: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      default: 'online',
    },
    paymentProvider: {
      type: String,
      default: 'razorpay',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
