import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal, X } from 'lucide-react';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/product/ProductCard';
import ShopFilters from './ShopFilters';
import styles from './page.module.css';

async function getShopData(searchParamsResolved) {
  try {
    await connectDB();

    const search = searchParamsResolved.search || '';
    const categorySlug = searchParamsResolved.category || '';
    const type = searchParamsResolved.type || '';
    const sort = searchParamsResolved.sort || '';

    // Get all categories for filter list
    const categories = await Category.find({}).sort({ displayOrder: 1 }).lean();

    // Build product filters
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (categorySlug) {
      const selectedCategory = await Category.findOne({ slug: categorySlug });
      if (selectedCategory) {
        filter.category = selectedCategory._id;
      }
    }

    if (type) {
      filter.productType = type;
    }

    let productQuery = Product.find(filter)
      .select('name slug images placeholderImage category variants priceType purchaseMode')
      .populate('category', 'name slug');

    // Sorting by first variant price
    if (sort === 'price_asc') {
      productQuery = productQuery.sort({ 'variants.0.price': 1 });
    } else if (sort === 'price_desc') {
      productQuery = productQuery.sort({ 'variants.0.price': -1 });
    } else {
      productQuery = productQuery.sort({ createdAt: -1 }); // default newest
    }

    const products = await productQuery.lean();

    // Convert ObjectIds to strings
    const stringify = (arr) => arr.map(item => ({
      ...item,
      _id: item._id.toString(),
      category: item.category ? { ...item.category, _id: item.category._id.toString() } : null,
      variants: item.variants ? item.variants.map(v => ({ ...v, _id: v._id?.toString() })) : []
    }));

    return {
      categories: categories.map(c => ({ ...c, _id: c._id.toString() })),
      products: stringify(products),
    };
  } catch (error) {
    console.error('Failed to get shop data:', error);
    return {
      categories: [],
      products: [],
    };
  }
}

export default async function ShopPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { categories, products } = await getShopData(resolvedSearchParams);

  const activeCategory = resolvedSearchParams.category || '';
  const activeType = resolvedSearchParams.type || '';
  const activeSort = resolvedSearchParams.sort || '';
  const activeSearch = resolvedSearchParams.search || '';

  // Product Types array
  const productTypes = ['fresh meat', 'ready to eat', 'live stock', 'eggs'];

  const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.name || activeCategory;
  const sortLabels = { price_asc: 'Price: Low to High', price_desc: 'Price: High to Low' };

  // Build a /shop URL that drops a single filter (for the removable chips).
  const urlwithout = (keyToRemove) => {
    const params = new URLSearchParams();
    const current = { search: activeSearch, category: activeCategory, type: activeType, sort: activeSort };
    Object.entries(current).forEach(([key, value]) => {
      if (value && key !== keyToRemove) params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  // Active-filter chips so shoppers can see and clear what's applied.
  const activeChips = [
    activeSearch && { key: 'search', label: `“${activeSearch}”` },
    activeCategory && { key: 'category', label: activeCategoryName },
    activeType && { key: 'type', label: activeType },
    activeSort && { key: 'sort', label: sortLabels[activeSort] },
  ].filter(Boolean);

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.shopContainer}>
        <div className="container">
          <h1 className={styles.title}>Browse Porville Cuts</h1>

          <div className={styles.shopLayout}>
            {/* Filters: static sidebar on desktop, slide-in drawer on mobile */}
            <ShopFilters
              categories={categories}
              productTypes={productTypes}
              active={{ search: activeSearch, category: activeCategory, type: activeType, sort: activeSort }}
            />

            {/* Main Products Grid */}
            <div className={styles.mainContent}>

              {/* Toolbar: result count + active-filter chips */}
              <div className={styles.toolbar}>
                <p className={styles.resultCount}>
                  Showing <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
                </p>
                {activeChips.length > 0 && (
                  <div className={styles.activeFilters}>
                    {activeChips.map((chip) => (
                      <Link key={chip.key} href={urlwithout(chip.key)} className={styles.filterChip}>
                        <span style={{ textTransform: chip.key === 'type' ? 'capitalize' : 'none' }}>{chip.label}</span>
                        <X size={13} />
                      </Link>
                    ))}
                    <Link href="/shop" className={styles.clearAll}>Clear all</Link>
                  </div>
                )}
              </div>

              {products.length === 0 ? (
                <div className={styles.emptyState}>
                  <SlidersHorizontal size={48} strokeWidth={1} style={{ color: 'var(--text-dark-muted)' }} />
                  <h3 className={styles.emptyTitle}>No cuts found</h3>
                  <p>Try resetting your filters or modifying your search query.</p>
                  <Link href="/shop" className="btn-primary" style={{ marginTop: '10px' }}>
                    Reset All Filters
                  </Link>
                </div>
              ) : (
                <div className={styles.productsGrid}>
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
export const metadata = {
  title: "Premium Meat Shop & Cuts Online",
  description: "Browse our premium range of fresh chicken, mutton, quail, duck, ready-to-eat salami, and organic farm-fresh eggs.",
};
