import React from 'react';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Review from '@/models/Review';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductDetailClient from '@/components/product/ProductDetailClient';

async function getProductData(slug) {
  try {
    await connectDB();

    const product = await Product.findOne({ slug }).populate('category').lean();

    if (!product) {
      return null;
    }

    // Load only approved reviews for this product
    const reviews = await Review.find({ product: product._id, approved: true })
      .sort({ createdAt: -1 })
      .lean();

    // Convert ObjectIds to strings
    const stringifyProduct = (p) => ({
      ...p,
      _id: p._id.toString(),
      category: p.category ? { ...p.category, _id: p.category._id.toString() } : null,
      variants: p.variants ? p.variants.map(v => ({ ...v, _id: v._id?.toString() })) : []
    });

    const stringifyReviews = (list) => list.map(r => ({
      ...r,
      _id: r._id.toString(),
      product: r.product.toString(),
      user: r.user ? r.user.toString() : null,
    }));

    return {
      product: stringifyProduct(product),
      reviews: stringifyReviews(reviews),
    };
  } catch (error) {
    console.error('Error loading product page:', error);
    return null;
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const data = await getProductData(slug);

  if (!data) {
    notFound();
  }

  const { product, reviews } = data;

  return (
    <>
      <Header />
      <CartDrawer />

      <main style={{ backgroundColor: 'var(--bg-cream)', minHeight: 'calc(100vh - var(--header-height))' }}>
        <div className="container">
          <ProductDetailClient product={product} initialReviews={reviews} />
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
    const product = await Product.findOne({ slug }).populate('category').lean();
    if (!product) return { title: 'Product Not Found' };

    const price = product.variants?.[0]?.salePrice || product.variants?.[0]?.price || '';
    const seoTitle = product.seoTitle || `${product.name} Fresh Delivery | Porville`;
    const seoDesc = product.seoDescription || `Buy fresh ${product.name} starting at ₹${price} in Sangam Vihar. Fresh Cut Pure Standards.`;

    return {
      title: seoTitle,
      description: seoDesc,
    };
  } catch (e) {
    return { title: 'Fresh Cuts | Porville' };
  }
}
