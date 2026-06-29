import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import AdminUser from '@/models/AdminUser';
import SiteSettings from '@/models/SiteSettings';
import Banner from '@/models/Banner';
import Coupon from '@/models/Coupon';
import { seedCategories, seedProducts } from '@/data/seedProducts';

// Force dynamic so this handler is never statically cached and always reads the
// incoming secret. (Reading request.headers already opts out of caching.)
export const dynamic = 'force-dynamic';

/**
 * Constant-time comparison to avoid leaking the secret via timing.
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * The seed route is destructive and writes admin credentials, so it MUST be
 * protected. Provide the secret as either:
 *   - Header: `Authorization: Bearer <SEED_SECRET>`
 *   - Header: `x-seed-secret: <SEED_SECRET>`
 *   - Query:  `/api/seed?secret=<SEED_SECRET>`
 */
function isAuthorized(request) {
  const expected = process.env.SEED_SECRET;

  // If no secret is configured on the server, refuse to run. This prevents an
  // accidentally-public seed endpoint in production.
  if (!expected) {
    return { ok: false, reason: 'SEED_SECRET is not configured on the server. Seeding is disabled.' };
  }

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerSecret = request.headers.get('x-seed-secret') || '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';

  const provided = bearer || headerSecret || querySecret;

  if (!provided || !safeEqual(provided, expected)) {
    return { ok: false, reason: 'Invalid or missing seed secret.' };
  }

  return { ok: true };
}

async function runSeed() {
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
            // Mirror the canonical fields too — findOneAndUpdate skips the
            // pre('save') hook that normally keeps these in sync.
            featured: prod.isFeatured !== undefined ? prod.isFeatured : false,
            bestSeller: prod.isBestSeller !== undefined ? prod.isBestSeller : false,
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

    // 4. Seed Admin User if not exists (only created once; never overwrites an
    //    existing admin password).
    const adminEmail = (process.env.ADMIN_EMAIL || 'porville1986@gmail.com').toLowerCase();
    let admin = await AdminUser.findOne({ email: adminEmail });
    if (!admin) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        throw new Error('ADMIN_PASSWORD env variable is required to create the initial admin user.');
      }
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

    return {
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
        coupons: 1,
      },
    };
}

async function handleSeed(request) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    // 401 for missing/invalid secret, 403 when seeding is disabled entirely.
    const status = auth.reason.includes('disabled') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.reason }, { status });
  }

  try {
    const result = await runSeed();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handleSeed(request);
}

export async function POST(request) {
  return handleSeed(request);
}
