import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  name: {
    type: String, // e.g., '450g', '900g', '1kg', 'Tray', 'Pieces'
    required: true,
  },
  price: {
    // Not required at the schema level: "on call" products legitimately carry
    // no price. Real validation (price > 0 unless on_call) is enforced in the
    // admin API so invalid fixed-price products can never be saved.
    type: Number,
    default: 0,
    min: 0,
  },
  salePrice: {
    type: Number,
    min: 0,
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock'],
    default: 'in_stock',
  },
  stockQty: {
    type: Number,
    default: 0,
  },
});

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // Array of Cloudinary image URLs
      default: [],
    },
    media: {
      type: [{
        type: { type: String, enum: ['image', 'video'], required: true },
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        alt: { type: String, default: '' },
      }],
      default: [],
    },
    variants: [VariantSchema],
    featured: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    placeholderImage: {
      type: String,
      default: '',
    },
    priceType: {
      type: String,
      enum: ['fixed', 'on_call'],
      default: 'fixed',
    },
    // How this product is priced/sold. Drives the admin pricing UI and the
    // variant label shown to customers. 'on_call' means no fixed price.
    unitType: {
      type: String,
      enum: ['pack_weight', 'per_piece', 'per_kg', 'per_tray', 'on_call'],
      default: 'pack_weight',
    },
    purchaseMode: {
      type: String,
      enum: ['cart', 'on_call'],
      default: 'cart',
    },
    productType: {
      type: String,
      enum: ['fresh meat', 'ready to eat', 'live stock', 'eggs'],
      required: true,
      default: 'fresh meat',
    },
    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save hook to synchronize deprecated/alias fields
ProductSchema.pre('save', function(next) {
  if (this.isModified('isFeatured')) {
    this.featured = this.isFeatured;
  } else if (this.isModified('featured')) {
    this.isFeatured = this.featured;
  }
  if (this.isModified('isBestSeller')) {
    this.bestSeller = this.isBestSeller;
  } else if (this.isModified('bestSeller')) {
    this.isBestSeller = this.bestSeller;
  }
  next();
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
