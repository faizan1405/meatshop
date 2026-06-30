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
    logoUrl: {
      type: String,
      default: '',
    },
    fssaiRefNo: {
      type: String,
      default: '30260223123490898',
    },
    fssaiLicenseName: {
      type: String,
      default: 'Vishal Kumar',
    },
    fssaiAddress: {
      type: String,
      default: 'Sangam Vihar, New Delhi, TIGRI, SAKET, South, Delhi, 110080',
    },
    fssaiKindOfBusiness: {
      type: String,
      default: 'Trade/Retail - Wholesaler, Distributor, Retailer; Manufacturer - Meat processing units, Fish and Fish Products',
    },
    fssaiAppDate: {
      type: String,
      default: '23-02-2026',
    },
    fssaiNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
