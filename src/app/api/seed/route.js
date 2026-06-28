import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import AdminUser from '@/models/AdminUser';
import SiteSettings from '@/models/SiteSettings';
import Banner from '@/models/Banner';
import Coupon from '@/models/Coupon';
import { seedCategories, seedProducts } from '@/data/seedProducts';

export async function GET(request) {
  try {
    await connectDB();

    // 1. Seed/Upsert Categories
    const categoryMap = {};
    for (const cat of seedCategories) {
      const updatedCat = await Category.findOneAndUpdate(
        { slug: cat.slug },
        { 
          $set: {
            name: cat.name,
            description: cat.description,
            image: cat.image,
            displayOrder: cat.displayOrder,
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
      categoryMap[cat.slug] = updatedCat._id;
    }

    // 2. Seed/Upsert Products
    for (const prod of seedProducts) {
      const categoryId = categoryMap[prod.categorySlug];
      if (!categoryId) {
        throw new Error(`Category slug ${prod.categorySlug} not found in seeded categories`);
      }

      const { categorySlug, ...rest } = prod;
      await Product.findOneAndUpdate(
        { slug: prod.slug },
        {
          $set: {
            ...rest,
            category: categoryId,
            isActive: prod.isActive !== undefined ? prod.isActive : true,
            isFeatured: prod.isFeatured !== undefined ? prod.isFeatured : false,
            isBestSeller: prod.isBestSeller !== undefined ? prod.isBestSeller : false,
            placeholderImage: prod.placeholderImage || '',
            priceType: prod.priceType || 'fixed',
            purchaseMode: prod.purchaseMode || 'cart',
          }
        },
        { upsert: true, new: true }
      );
    }

    // 3. Clean up deleted categories and products (e.g. Pork)
    const categorySlugs = seedCategories.map(c => c.slug);
    const productSlugs = seedProducts.map(p => p.slug);

    const deletedProductsRes = await Product.deleteMany({ slug: { $nin: productSlugs } });
    const deletedCategoriesRes = await Category.deleteMany({ slug: { $nin: categorySlugs } });

    // 4. Seed Admin User if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'porville1986@gmail.com';
    let admin = await AdminUser.findOne({ email: adminEmail });
    if (!admin) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'Porville@1986';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      admin = await AdminUser.create({
        name: 'Porville Admin',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      });
    }

    // 5. Seed default Site Settings if not exists
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = await SiteSettings.create({
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
    }

    // 6. Seed a default Banner if not exists
    let banner = await Banner.findOne({});
    if (!banner) {
      banner = await Banner.create({
        title: 'Premium Fresh Meat & Cuts',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
        link: '/shop',
        active: true,
        displayOrder: 1,
      });
    }

    // 7. Seed a default Coupon if not exists
    let coupon = await Coupon.findOne({ code: 'WELCOME10' });
    if (!coupon) {
      coupon = await Coupon.create({
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 400,
        maxDiscountValue: 100,
        active: true,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
    }

    const totalCategoriesCount = await Category.countDocuments({});
    const totalProductsCount = await Product.countDocuments({});

    return NextResponse.json({
      success: true,
      message: 'Database upserted successfully',
      seeded: {
        categories: totalCategoriesCount,
        products: totalProductsCount,
        deletedCategories: deletedCategoriesRes.deletedCount,
        deletedProducts: deletedProductsRes.deletedCount,
        admin: admin.email,
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
