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
import CategoryCarousel from '@/components/products/CategoryCarousel';
import styles from './page.module.css';

// Pre-seeded fallback data to prevent build failure if database is empty/not loaded yet.
const fallbackCategories = [
  { name: 'Chicken', slug: 'chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80', subtitle: 'Tender & Fresh Cuts' },
  { name: 'Mutton', slug: 'mutton', image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80', subtitle: 'Juicy Curry Cuts' },
  { name: 'Quail', slug: 'quail', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=400&q=80', subtitle: 'Pasture-Raised Batair' },
  { name: 'Duck', slug: 'duck', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80', subtitle: 'Rich Dressed Duck' },
  { name: 'Eggs', slug: 'eggs', image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=400&q=80', subtitle: 'Farm-Fresh Organic' },
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

    // Query best sellers (support both `bestSeller` and the `isBestSeller` alias).
    let bestSellerProducts = await Product.find({ $or: [{ bestSeller: true }, { isBestSeller: true }], isActive: { $ne: false } })
      .populate('category')
      .limit(12)
      .lean();

    // Query products for the Chicken / Mutton / Quail / Ready-to-Eat / Eggs
    // (and Duck) homepage rows. Match the loaded categories by slug OR name,
    // case-insensitively, so DB variations ('chicken' vs 'Chicken') resolve
    // safely. Then fetch active products for those category ids in one go and
    // split per slug below.
    const targetSlugs = ['chicken', 'mutton', 'quail', 'ready-to-eat', 'eggs', 'duck'];
    const targetCatIds = categories
      .filter((c) => targetSlugs.includes((c.slug || '').toLowerCase()) || targetSlugs.includes((c.name || '').toLowerCase()))
      .map((c) => c._id);
    let categoryProducts = targetCatIds.length
      ? await Product.find({ category: { $in: targetCatIds }, isActive: { $ne: false } })
          .populate('category')
          .lean()
      : [];

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

    const categoryProductsStr = stringify(categoryProducts);
    // Normalise slug/name to a lowercase hyphenated key so 'Ready To Eat',
    // 'ready to eat' and 'ready-to-eat' all resolve to the same section.
    const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '-');
    const bySlug = (slug) => categoryProductsStr.filter(
      (p) => norm(p.category?.slug) === slug || norm(p.category?.name) === slug
    );

    return {
      categories: stringifiedCategories.length ? stringifiedCategories : fallbackCategories,
      featuredProducts: stringify(featuredProducts),
      bestSellerProducts: stringify(bestSellerProducts),
      chickenProducts: bySlug('chicken'),
      muttonProducts: bySlug('mutton'),
      quailProducts: bySlug('quail'),
      readyToEatProducts: bySlug('ready-to-eat'),
      eggsProducts: bySlug('eggs'),
      duckProducts: bySlug('duck'),
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
      bestSellerProducts: [],
      chickenProducts: [],
      muttonProducts: [],
      quailProducts: [],
      readyToEatProducts: [],
      eggsProducts: [],
      duckProducts: [],
      banners: [],
      reviews: fallbackReviews,
    };
  }
}

// Reusable homepage product row — keeps every category / Best Seller section
// identical in structure (no duplicate JSX). Renders nothing when empty.
// `compact` trims the vertical rhythm (padding, heading margins, card height)
// so two category rows can share a single desktop viewport while scrolling.
function ProductSection({ tagline, title, subtitle, products, viewAllLink, background, compact }) {
  if (!products || products.length === 0) return null;
  return (
    <section
      className={compact ? styles.compactSection : 'section-padding'}
      style={{ backgroundColor: background || 'var(--bg-cream)' }}
    >
      <div className="container">
        {tagline && <span className={styles.sectionTagline}>{tagline}</span>}
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        <ProductCarousel products={products} autoplayInterval={3000} compact={compact} />
        {viewAllLink && (
          <div style={{ textAlign: 'center', marginTop: compact ? '1.25rem' : '2rem' }}>
            <Link href={viewAllLink} className="btn-primary">View All</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function Home() {
  const {
    categories,
    featuredProducts,
    bestSellerProducts,
    chickenProducts,
    muttonProducts,
    quailProducts,
    readyToEatProducts,
    eggsProducts,
    duckProducts,
    banners,
    reviews,
  } = await getData();

  // Best Sellers row: prefer admin-flagged best sellers, fall back to featured.
  const bestSellers = bestSellerProducts?.length ? bestSellerProducts : featuredProducts;

  const heroTitle = banners?.[0]?.title || 'Premium Fresh Meat & Cuts';

  // Lead the hero with our full catalogue as compact chips so every available
  // category is one tap away, not just the first four.
  const heroCategories = categories;

  return (
    <>
      <Header />
      <CartDrawer />

      <main style={{ minHeight: '100vh' }}>

        {/* 1. Product-led Hero — copy on the left, a live category showcase on the right */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <span className={styles.tagline}>Sangam Vihar&apos;s Premium Butcher</span>
                <h1 className={styles.title}>{heroTitle}</h1>
                <p className={styles.subtitle}>
                  Custom-cut to order, vacuum-sealed and delivered chilled within 2 hours.
                  Pasture-raised meats and farm-fresh eggs — never frozen, never pre-packaged.
                </p>
                <div className={styles.heroBtns}>
                  <Link href="/shop" className="btn-gold">
                    Shop Fresh Cuts
                  </Link>
                </div>
                <ul className={styles.heroTrust}>
                  <li><Sparkles size={16} /> Cut after you order</li>
                  <li><Truck size={16} /> 2-hour delivery</li>
                  <li><ShieldCheck size={16} /> FSSAI registered</li>
                </ul>
              </div>

              {heroCategories.length > 0 && (
                <div className={styles.heroCategories} aria-label="Shop by category">
                  <span className={styles.heroCategoriesLabel}>Shop by Category</span>
                  <div className={styles.heroChips}>
                    {heroCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        className={styles.heroChip}
                      >
                        <span className={styles.heroChipThumb}>
                          <img
                            src={cat.image || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=200&q=80'}
                            alt=""
                            loading="eager"
                          />
                        </span>
                        <span className={styles.heroChipLabel}>{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <Link href="#categories" className={`btn-gold ${styles.heroCategoriesBtn}`}>
                    Explore Categories
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Best Sellers — leads the product rows straight after the hero */}
        <ProductSection
          tagline="Chef's Picks"
          title="Best Sellers"
          subtitle="Our most-loved cuts, cut fresh on order."
          products={bestSellers}
          viewAllLink="/shop"
          background="var(--bg-cream)"
          compact
        />

        {/* 3. Fresh Chicken */}
        <ProductSection
          tagline="Farm Fresh"
          title="Fresh Chicken"
          subtitle="Tender, antibiotic-free chicken — custom-cut on order."
          products={chickenProducts}
          viewAllLink="/category/chicken"
          background="var(--white)"
          compact
        />

        {/* 4. Fresh Mutton */}
        <ProductSection
          tagline="Farm Fresh"
          title="Fresh Mutton"
          subtitle="Juicy, tender curry cuts from healthy, pasture-raised goats."
          products={muttonProducts}
          viewAllLink="/category/mutton"
          background="var(--bg-cream)"
          compact
        />

        {/* 5. Fresh Quail */}
        <ProductSection
          tagline="Farm Fresh"
          title="Fresh Quail"
          subtitle="Pasture-raised batair — clean, tender and full of flavor."
          products={quailProducts}
          viewAllLink="/category/quail"
          background="var(--white)"
          compact
        />

        {/* 6. Fresh Duck — sits between Quail and Ready to Eat */}
        <ProductSection
          tagline="Farm Fresh"
          title="Fresh Duck"
          subtitle="Rich, dressed duck sourced from healthy pasture-raised birds."
          products={duckProducts}
          viewAllLink="/category/duck"
          background="var(--bg-cream)"
          compact
        />

        {/* 7. Ready to Eat */}
        <ProductSection
          tagline="Heat & Serve"
          title="Ready to Eat"
          subtitle="Smoked, cooked and marinated favourites — ready in minutes."
          products={readyToEatProducts}
          viewAllLink="/category/ready-to-eat"
          background="var(--white)"
          compact
        />

        {/* 8. Farm-Fresh Eggs */}
        <ProductSection
          tagline="Farm Fresh"
          title="Eggs"
          subtitle="Farm-fresh organic eggs, gathered daily."
          products={eggsProducts}
          viewAllLink="/category/eggs"
          background="var(--bg-cream)"
          compact
        />

        {/* 9. Category Section: Explore Fresh Categories */}
        <section id="categories" className="section-padding" style={{ backgroundColor: 'var(--bg-cream)', borderBottom: '1px solid var(--border-cream)' }}>
          <div className="container">
            <span className={styles.sectionTagline}>Curated Selection</span>
            <h2 className={styles.sectionTitle}>Explore Fresh Categories</h2>
            <p className={styles.sectionSubtitle}>
              Browse through our range of farm-fresh, premium meats and gourmet items. Select a category to see available cuts.
            </p>
            <CategoryCarousel autoplayInterval={3500}>
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
            </CategoryCarousel>
          </div>
        </section>

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

        {/* 6. Featured Products Section — single admin-controlled "Featured" list
            (replaces the old duplicate Best Sellers + Featured sections). Mark a
            product as Featured in the admin panel to surface it here. */}
        {featuredProducts.length > 0 && (
          <section className="section-padding" style={{ backgroundColor: 'var(--bg-cream)' }}>
            <div className="container">
              <span className={styles.sectionTagline}>Chef&apos;s Picks</span>
              <h2 className={styles.sectionTitle}>Featured Best Sellers</h2>
              <p className={styles.sectionSubtitle}>
                A hand-picked selection of our most-loved cuts — chosen by Porville and cut fresh on order.
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
