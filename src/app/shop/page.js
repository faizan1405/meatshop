import React from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/product/ProductCard';
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
  const productTypes = ['fresh meat', 'ready to eat', 'live stock', 'eggs', 'special'];

  // Helper function to build dynamic filter URLs
  const getFilterUrl = (newParams) => {
    const params = new URLSearchParams();
    if (activeSearch) params.set('search', activeSearch);
    if (activeCategory) params.set('category', activeCategory);
    if (activeType) params.set('type', activeType);
    if (activeSort) params.set('sort', activeSort);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    return `/shop?${params.toString()}`;
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.shopContainer}>
        <div className="container">
          <h1 className={styles.title}>Browse Porville Cuts</h1>

          <div className={styles.shopLayout}>
            {/* Sidebar Filters */}
            <aside className={styles.sidebar}>
              
              {/* Search Bar */}
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>
                  <Search size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary-gold)' }} />
                  Search
                </h3>
                <form action="/shop" method="GET">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search Cuts..."
                    defaultValue={activeSearch}
                    className={styles.searchInput}
                  />
                  {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
                  {activeType && <input type="hidden" name="type" value={activeType} />}
                  {activeSort && <input type="hidden" name="sort" value={activeSort} />}
                </form>
                {(activeSearch || activeCategory || activeType || activeSort) && (
                  <Link href="/shop" className={styles.resetButton}>
                    <X size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Reset Filters
                  </Link>
                )}
              </div>

              {/* Category Filter */}
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>Categories</h3>
                <ul className={styles.list}>
                  <li>
                    <Link 
                      href={getFilterUrl({ category: '' })}
                      className={`${styles.filterLink} ${!activeCategory ? styles.filterLinkActive : ''}`}
                    >
                      All Categories
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={getFilterUrl({ category: cat.slug })}
                        className={`${styles.filterLink} ${activeCategory === cat.slug ? styles.filterLinkActive : ''}`}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Product Type Filter */}
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>Product Types</h3>
                <ul className={styles.list}>
                  <li>
                    <Link 
                      href={getFilterUrl({ type: '' })}
                      className={`${styles.filterLink} ${!activeType ? styles.filterLinkActive : ''}`}
                    >
                      All Types
                    </Link>
                  </li>
                  {productTypes.map((type) => (
                    <li key={type}>
                      <Link
                        href={getFilterUrl({ type })}
                        className={`${styles.filterLink} ${activeType === type ? styles.filterLinkActive : ''}`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {type}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sorting */}
              <div className={styles.filterBox}>
                <h3 className={styles.filterTitle}>
                  <ArrowUpDown size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary-gold)' }} />
                  Sort By
                </h3>
                <ul className={styles.list}>
                  <li>
                    <Link
                      href={getFilterUrl({ sort: '' })}
                      className={`${styles.filterLink} ${!activeSort ? styles.filterLinkActive : ''}`}
                    >
                      Newest Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={getFilterUrl({ sort: 'price_asc' })}
                      className={`${styles.filterLink} ${activeSort === 'price_asc' ? styles.filterLinkActive : ''}`}
                    >
                      Price: Low to High
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={getFilterUrl({ sort: 'price_desc' })}
                      className={`${styles.filterLink} ${activeSort === 'price_desc' ? styles.filterLinkActive : ''}`}
                    >
                      Price: High to Low
                    </Link>
                  </li>
                </ul>
              </div>

            </aside>

            {/* Main Products Grid */}
            <div className={styles.mainContent}>
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
