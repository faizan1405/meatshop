import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Cloudinary image URL
      required: true,
    },
    link: {
      type: String, // Redirect URL e.g. /shop, /category/chicken
      default: '/shop',
    },
    active: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
