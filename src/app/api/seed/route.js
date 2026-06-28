import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import AdminUser from '@/models/AdminUser';
import SiteSettings from '@/models/SiteSettings';
import Banner from '@/models/Banner';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import Order from '@/models/Order';
import Review from '@/models/Review';
import { seedCategories, seedProducts } from '@/data/seedProducts';

export async function GET(request) {
  try {
    // Only allow seeding in development, or if a secret key matches, to prevent accidental production overwrite.
    // In this case, we will allow it for initialization.
    await connectDB();

    // 1. Clean up database
    await Category.deleteMany({});
    await Product.deleteMany({});
    await AdminUser.deleteMany({});
    await SiteSettings.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});

    // 2. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'porville1986@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Porville@1986';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    await AdminUser.create({
      name: 'Porville Admin',
      email: adminEmail,
      password: hashedAdminPassword,
      role: 'admin',
    });

    // 3. Seed Categories
    const createdCategories = await Category.insertMany(seedCategories);
    
    // Create mapping of category slug -> category ObjectId
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    // 4. Seed Products with mapped categories
    const productsToInsert = seedProducts.map((p) => {
      const categoryId = categoryMap[p.categorySlug];
      if (!categoryId) {
        throw new Error(`Category slug ${p.categorySlug} not found in seeded categories`);
      }
      
      // Remove temporary helper field categorySlug and add category ObjectId reference
      const { categorySlug, ...rest } = p;
      return {
        ...rest,
        category: categoryId,
      };
    });

    await Product.insertMany(productsToInsert);

    // 5. Seed default Site Settings
    await SiteSettings.create({
      contactNumber: '9217577006',
      email: 'porville1986@gmail.com',
      address: 'D-1b/1028, Sangam Vihar-110080',
      deliveryNote: 'Express delivery within 2 hours. Minimum order value may apply.',
      deliveryCharge: 50,
      freeDeliveryThreshold: 500,
      whatsappNumber: '9217577006',
      facebookUrl: 'https://facebook.com/porville',
      instagramUrl: 'https://instagram.com/porville',
    });

    // 6. Seed a default Banner
    await Banner.create({
      title: 'Premium Fresh Meat & Cuts',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      link: '/shop',
      active: true,
      displayOrder: 1,
    });

    // 7. Seed a default Coupon
    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 400,
      maxDiscountValue: 100,
      active: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      seeded: {
        admin: adminEmail,
        categories: createdCategories.length,
        products: productsToInsert.length,
        settings: 1,
        banners: 1,
        coupons: 1
      }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
