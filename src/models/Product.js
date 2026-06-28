import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  name: {
    type: String, // e.g., '450g', '900g', '1kg', 'Tray', 'Pieces'
    required: true,
  },
  price: {
    type: Number,
    required: true,
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
    variants: [VariantSchema],
    featured: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    productType: {
      type: String,
      enum: ['fresh meat', 'ready to eat', 'live stock', 'eggs', 'special'],
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

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
