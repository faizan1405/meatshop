import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';

async function getCategoryData(slug) {
  try {
    await connectDB();

    const category = await Category.findOne({ slug }).lean();

    if (!category) {
      return null;
    }

    const products = await Product.find({ category: category._id })
      .populate('category')
      .sort({ createdAt: -1 })
      .lean();

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
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', color: 'var(--text-dark)' }}>
                No cuts available
              </h3>
              <p>We are currently restocking our fresh cuts. Please check back shortly.</p>
              <Link href="/shop" className="btn-primary" style={{ marginTop: '10px' }}>
                Browse Other Categories
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
    const category = await Category.findOne({ slug }).lean();
    if (!category) return { title: 'Category Not Found' };

    return {
      title: `${category.name} Fresh Cuts Online`,
      description: category.description || `Shop premium, fresh, and hygienic ${category.name.toLowerCase()} cuts online from Porville. Express 2-hour home delivery.`,
    };
  } catch (e) {
    return { title: 'Category | Porville' };
  }
}
