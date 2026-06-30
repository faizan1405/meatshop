import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, Heart, Truck, Sparkles, Star, MessageSquare } from 'lucide-react';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Banner from '@/models/Banner';
import Review from '@/models/Review';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/product/ProductCard';
import ProductCarousel from '@/components/products/ProductCarousel';
import styles from './page.module.css';

// Pre-seeded fallback data to prevent build failure if database is empty/not loaded yet.
const fallbackCategories = [
  { name: 'Chicken', slug: 'chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80', subtitle: 'Tender & Fresh Cuts' },
  { name: 'Mutton', slug: 'mutton', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80', subtitle: 'Juicy Curry Cuts' },
  { name: 'Quail', slug: 'quail', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=400&q=80', subtitle: 'Pasture-Raised Batair' },
  { name: 'Duck', slug: 'duck', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80', subtitle: 'Rich Dressed Duck' },
  { name: 'Eggs', slug: 'eggs', image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=400&q=80', subtitle: 'Farm-Fresh Organic' },
  { name: 'Special', slug: 'special', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80', subtitle: 'Gourmet Selection' },
  { name: 'Live Stock', slug: 'live-stock', image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=400&q=80', subtitle: 'Healthy Live Birds' },
  { name: 'Ready To Eat', slug: 'ready-to-eat', image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=400&q=80', subtitle: 'Smoked & Cooked Salami' },
];

const fallbackReviews = [
  { name: 'Amit Sharma', rating: 5, comment: 'Hands down the best quality chicken in Sangam Vihar. Super clean packaging and delivered chilled!', date: 'June 20, 2026' },
  { name: 'Priya Verma', rating: 5, comment: 'The mutton curry cut was incredibly tender. Sourced well, pure standards indeed. Will order again.', date: 'June 18, 2026' },
  { name: 'John Doe', rating: 5, comment: 'Tried their Smoked Chicken Salami and it is fantastic. Super fast 2-hour delivery.', date: 'June 12, 2026' },
];

async function getData() {
  try {
    await connectDB();

    // Query active categories only
    let categories = await Category.find({ isActive: { $ne: false } }).sort({ displayOrder: 1 }).lean();

    // Query product counts per category
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    productCounts.forEach(pc => {
      if (pc._id) {
        countMap[pc._id.toString()] = pc.count;
      }
    });
    
    // Query featured products (support both `featured` and the `isFeatured`
    // alias, since seeded docs set the alias and admin-created docs set `featured`).
    let featuredProducts = await Product.find({ $or: [{ featured: true }, { isFeatured: true }] })
      .populate('category')
      .limit(12)
      .lean();

    // Query best seller products (same dual-field handling as above).
    let bestSellers = await Product.find({ $or: [{ bestSeller: true }, { isBestSeller: true }] })
      .populate('category')
      .limit(12)
      .lean();

    // Query active banners
    let banners = await Banner.find({ active: true }).sort({ displayOrder: 1 }).lean();

    // Query approved reviews
    let reviews = await Review.find({ approved: true }).limit(3).lean();

    // Convert ObjectIds to strings
    const stringify = (arr) => arr.map(item => ({
      ...item,
      _id: item._id.toString(),
      ...(item.category ? { category: { ...item.category, _id: item.category._id.toString() } } : {}),
      variants: item.variants ? item.variants.map(v => ({ ...v, _id: v._id?.toString() })) : []
    }));

    const stringifiedCategories = categories.map(cat => ({
      ...cat,
      _id: cat._id.toString(),
      productCount: countMap[cat._id.toString()] || 0
    }));

    return {
      categories: stringifiedCategories.length ? stringifiedCategories : fallbackCategories,
      featuredProducts: stringify(featuredProducts),
      bestSellers: stringify(bestSellers),
      banners: stringify(banners),
      reviews: reviews.length ? stringify(reviews) : fallbackReviews,
    };
  } catch (error) {
    console.error('Failed to load DB data for Home Page:', error.message);
    console.warn(
      '[home] ⚠️  Serving hardcoded FALLBACK content because the database is unavailable. This is NOT real data — fix the MongoDB connection before going live.'
    );
    return {
      categories: fallbackCategories,
      featuredProducts: [],
      bestSellers: [],
      banners: [],
      reviews: fallbackReviews,
    };
  }
}

export default async function Home() {
  const { categories, featuredProducts, bestSellers, banners, reviews } = await getData();

  const heroImage = banners?.[0]?.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80';
  const heroTitle = banners?.[0]?.title || 'Premium Fresh Meat & Cuts';

  return (
    <>
      <Header />
      <CartDrawer />

      <main style={{ minHeight: '100vh' }}>
        
        {/* 1. Premium Hero Section */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroContent}>
              <span className={styles.tagline}>Fresh Cut Pure Standards</span>
              <h1 className={styles.title}>{heroTitle}</h1>
              <p className={styles.subtitle}>
                Experience premium quality meats, pasture-raised birds, and organic farm fresh eggs processed in 100% hygienic facilities. Delivered fresh to your home within 2 hours.
              </p>
              <div className={styles.heroBtns}>
                <Link href="/shop" className="btn-gold">
                  Shop Fresh Cuts
                </Link>
                <Link href="#categories" className="btn-primary">
                  Explore Categories
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.heroBg}>
            <img 
              src={heroImage} 
              alt="Porville Premium Meat Hero"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </section>

        {/* 2. Category Section: Shop by Category */}
        <section id="categories" className="section-padding" style={{ backgroundColor: 'var(--bg-cream)', borderBottom: '1px solid var(--border-cream)' }}>
          <div className="container">
            <span className={styles.sectionTagline}>Curated Selection</span>
            <h2 className={styles.sectionTitle}>Explore Fresh Categories</h2>
            <p className={styles.sectionSubtitle}>
              Browse through our range of farm-fresh, premium meats and gourmet items. Select a category to see available cuts.
            </p>
            <div className={styles.categoryGrid}>
              {categories.map((cat) => {
                const count = cat.productCount;
                const subtitle = count !== undefined ? (count > 0 ? `${count} Fresh Cuts` : 'Premium Cuts') : (cat.subtitle || 'Premium Cuts');
                
                // Fallback clean placeholder image if category image is missing
                const imageSrc = cat.image || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80';

                return (
                  <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.categoryCard}>
                    <div className={styles.categoryImageContainer}>
                      <img src={imageSrc} alt={cat.name} className={styles.categoryImage} />
                      <div className={styles.categoryOverlay}>
                        <span className={styles.shopNowText}>Shop Now</span>
                      </div>
                    </div>
                    <div className={styles.categoryDetails}>
                      <h3 className={styles.categoryName}>{cat.name}</h3>
                      <p className={styles.categoryCount}>{subtitle}</p>
                      <div className={styles.categoryBtn}>
                        <span>Shop Now</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}>
                          <path d="M4.5 9L7.5 6L4.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Best Selling Products */}
        {bestSellers.length > 0 && (
          <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
            <div className="container">
              <h2 className={styles.sectionTitle}>Porville Best Sellers</h2>
              <p className={styles.sectionSubtitle}>
                Our customer favourites, cut fresh and delivered chilled.
              </p>
              <ProductCarousel products={bestSellers} autoplayInterval={3000} />
            </div>
          </section>
        )}

        {/* 4. Fresh Cut Pure Standards (Branding Line Showcase) */}
        <section className="section-padding" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-light)', borderTop: '2px solid var(--primary-gold)' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px' }}>
              <div className="reveal-on-scroll" style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span style={{ color: 'var(--primary-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.85rem' }}>
                  Our Promise
                </span>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', color: 'var(--primary-gold-light)' }}>
                  Fresh Cut. Pure Standards.
                </h2>
                <p style={{ color: 'var(--text-light-muted)' }}>
                  At Porville, we do not cut corners. Our meat is sourced exclusively from pasture-raised, healthy livestock. Every single order is custom-cut by our master butchers only after you place your order.
                </p>
                <p style={{ color: 'var(--text-light-muted)' }}>
                  We seal each cut vacuum-tight and deliver it using insulated cold-chain boxes to maintain complete freshness and avoid any contamination. That is the Porville standard.
                </p>
              </div>
              <div className="reveal-on-scroll zoom-frame" style={{ flex: '1 1 400px', overflow: 'hidden', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--primary-gold)' }}>
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                  alt="Pure Standards butchery"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Why Choose Porville */}
        <section className={`${styles.features} section-padding`}>
          <div className="container">
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Sparkles size={24} />
                </div>
                <h3 className={styles.featureTitle}>Fresh Cuts</h3>
                <p className={styles.featureDesc}>Order placed. Butcher cuts. Delivered fresh. Never frozen or pre-packaged.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <ShieldCheck size={24} />
                </div>
                <h3 className={styles.featureTitle}>Hygienic Packaging</h3>
                <p className={styles.featureDesc}>Insulated vacuum-sealed bags that lock in moisture, flavor, and absolute safety.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Award size={24} />
                </div>
                <h3 className={styles.featureTitle}>Premium Quality</h3>
                <p className={styles.featureDesc}>100% farm-raised birds, quality checked and antibiotic-free meat standards.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Truck size={24} />
                </div>
                <h3 className={styles.featureTitle}>Fast Delivery</h3>
                <p className={styles.featureDesc}>Express shipping within 2 hours across Sangam Vihar and neighboring sectors.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="section-padding" style={{ backgroundColor: 'var(--bg-cream)' }}>
            <div className="container">
              <h2 className={styles.sectionTitle}>Featured Gourmet Cuts</h2>
              <p className={styles.sectionSubtitle}>
                A collection of special cuts curated for your special culinary nights.
              </p>
              <ProductCarousel products={featuredProducts} autoplayInterval={3000} />
            </div>
          </section>
        )}

        {/* 8. Customer Reviews */}
        <section className="section-padding" style={{ backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border-cream)' }}>
          <div className="container">
            <h2 className={styles.sectionTitle}>What Customers Say</h2>
            <p className={styles.sectionSubtitle}>
              Read true experiences from meat lovers who trust Porville.
            </p>
            <div className={styles.reviewsGrid}>
              {reviews.map((rev, index) => (
                <div key={index} className={styles.reviewCard}>
                  <div className={styles.stars}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="var(--primary-gold)" stroke="none" />
                    ))}
                  </div>
                  <p className={styles.comment}>"{rev.comment}"</p>
                  <div>
                    <h4 className={styles.reviewer}>{rev.name}</h4>
                    <span className={styles.date}>{rev.date || 'Verified Buyer'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Contact / WhatsApp CTA */}
        <section className={`${styles.cta} section-padding`}>
          <div className="container">
            <div className={styles.ctaBox}>
              <h2 className={styles.ctaTitle}>Need Custom Butcher Cuts?</h2>
              <p className={styles.ctaDesc}>
                Whether you need special shapes, bulk stock, or specific bird sizes, we are here. Text us directly on WhatsApp or call our support line.
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a 
                  href="https://wa.me/919217577006" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-gold"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <MessageSquare size={18} />
                  <span>Chat on WhatsApp</span>
                </a>
                <a 
                  href="tel:9217577006" 
                  className="btn-secondary"
                >
                  Call Support: 9217577006
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
