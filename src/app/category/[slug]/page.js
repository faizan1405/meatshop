import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';

const fallbackCategories = [
  { name: 'Chicken', slug: 'chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80', description: 'Fresh, tender, and hygienically cut chicken parts and whole birds.' },
  { name: 'Mutton', slug: 'mutton', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80', description: 'Premium quality goat and lamb cuts, rich in flavor and nutrition.' },
  { name: 'Quail', slug: 'quail', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80', description: 'Nutritious and flavor-packed quail meat, sourced from selected farms.' },
  { name: 'Duck', slug: 'duck', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80', description: 'Plump and juicy duck meat, ideal for roasting and gourmet dishes.' },
  { name: 'Eggs', slug: 'eggs', image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80', description: 'Organic, farm-fresh eggs loaded with proteins and nutrients.' },
  { name: 'Special', slug: 'special', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', description: 'Porville specialty cuts, exotic meats, and limited-time offers.' },
  { name: 'Live Stock', slug: 'live-stock', image: 'https://images.unsplash.com/photo-1548550022-cbfaf1eb6449?auto=format&fit=crop&w=600&q=80', description: 'Healthy live farm birds and livestock raised under premium guidelines.' },
  { name: 'Ready To Eat', slug: 'ready-to-eat', image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80', description: 'Pre-marinated, smoked, and fully cooked premium meat delicacies.' }
];

async function getCategoryData(slug) {
  try {
    await connectDB();

    let category = await Category.findOne({ slug }).lean();

    if (!category) {
      // Find in fallbackCategories to avoid 404
      const fbCat = fallbackCategories.find(c => c.slug === slug);
      if (!fbCat) {
        return null;
      }
      category = {
        _id: 'fallback-' + slug,
        name: fbCat.name,
        slug: fbCat.slug,
        description: fbCat.description,
        image: fbCat.image,
      };
    }

    let products = [];
    if (mongoose.Types.ObjectId.isValid(category._id)) {
      products = await Product.find({ category: category._id })
        .populate('category')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Convert ObjectIds to strings
    const stringify = (arr) => arr.map(item => ({
      ...item,
      _id: item._id.toString(),
      category: item.category ? { ...item.category, _id: item.category._id.toString() } : null,
      variants: item.variants ? item.variants.map(v => ({ ...v, _id: v._id?.toString() })) : []
    }));

    return {
      category: {
        ...category,
        _id: category._id.toString(),
      },
      products: stringify(products),
    };
  } catch (error) {
    console.error('Error loading category page:', error);
    return null;
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const data = await getCategoryData(slug);

  if (!data) {
    notFound();
  }

  const { category, products } = data;

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.container}>
        <div className="container">
          
          {/* Category Hero Banner */}
          <div className={styles.banner}>
            <div className={styles.bannerContent} style={{ padding: '0 40px' }}>
              <h1 className={styles.title}>{category.name} Cuts</h1>
              <p className={styles.desc}>
                {category.description || `Browse our premium select cuts of fresh ${category.name.toLowerCase()} processed under 100% hygiene.`}
              </p>
            </div>
            {/* Ambient image background */}
            {category.image && (
              <div
                className={styles.ambient}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '40%',
                  height: '100%',
                  backgroundImage: `url(${category.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.35,
                  zIndex: 1,
                }}
              />
            )}
          </div>

          {/* Category Products */}
          {products.length === 0 ? (
            <div className={styles.emptyState}>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '8px' }}>
                Products coming soon
              </h3>
              <p style={{ color: 'var(--text-dark-muted)', marginBottom: '20px', maxWidth: '400px' }}>
                We are currently preparing fresh cuts for this category. Please check back shortly or explore our other premium cuts.
              </p>
              <Link href="/shop" className="btn-primary">
                Back to Shop
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    await connectDB();
    let category = await Category.findOne({ slug }).lean();
    if (!category) {
      const fbCat = fallbackCategories.find(c => c.slug === slug);
      if (!fbCat) return { title: 'Category Not Found' };
      category = fbCat;
    }

    return {
      title: `${category.name} Products | Porville`,
      description: category.description || `Shop premium, fresh, and hygienic ${category.name.toLowerCase()} cuts online from Porville. Express 2-hour home delivery.`,
    };
  } catch (e) {
    return { title: 'Category | Porville' };
  }
}
