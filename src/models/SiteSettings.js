import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
    contactNumber: {
      type: String,
      default: '9217577006',
    },
    email: {
      type: String,
      default: 'porville1986@gmail.com',
    },
    address: {
      type: String,
      default: 'D-1b/1028, Sangam Vihar-110080',
    },
    deliveryNote: {
      type: String,
      default: 'Express delivery within 2 hours. Minimum order value may apply.',
    },
    deliveryCharge: {
      type: Number,
      default: 50,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500,
    },
    whatsappNumber: {
      type: String,
      default: '9217577006',
    },
    facebookUrl: {
      type: String,
      default: '',
    },
    instagramUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
