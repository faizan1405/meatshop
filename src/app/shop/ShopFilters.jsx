'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowUpDown, X, SlidersHorizontal } from 'lucide-react';
import styles from './page.module.css';

/**
 * Filter panel for the shop page.
 *  - Desktop (>= 992px): renders as a static sticky sidebar.
 *  - Mobile (< 992px):  collapses behind a "Filters" button that opens a
 *    slide-in drawer, so the filter list never pushes products below the fold.
 *
 * All filtering still happens through plain <Link> navigations / GET form
 * submits (server-side), so this only adds the open/close interaction.
 */
export default function ShopFilters({ categories, productTypes, active }) {
  const [open, setOpen] = useState(false);

  const { search: activeSearch, category: activeCategory, type: activeType, sort: activeSort } = active;
  const hasActiveFilters = activeSearch || activeCategory || activeType || activeSort;

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close the drawer with Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const buildUrl = (newParams) => {
    const params = new URLSearchParams();
    if (activeSearch) params.set('search', activeSearch);
    if (activeCategory) params.set('category', activeCategory);
    if (activeType) params.set('type', activeType);
    if (activeSort) params.set('sort', activeSort);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    });

    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile trigger — only visible below 992px */}
      <button
        type="button"
        className={styles.mobileFilterToggle}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="shop-filter-panel"
      >
        <SlidersHorizontal size={18} />
        <span>Filters &amp; Sort</span>
        {hasActiveFilters && <span className={styles.filterDot} aria-hidden="true" />}
      </button>

      {/* Backdrop (mobile drawer only) */}
      <div
        className={`${styles.drawerBackdrop} ${open ? styles.drawerBackdropOpen : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        id="shop-filter-panel"
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
        aria-label="Product filters"
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Filters &amp; Sort</h2>
          <button type="button" className={styles.drawerClose} onClick={close} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
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
          {hasActiveFilters && (
            <Link href="/shop" className={styles.resetButton} onClick={close}>
              <X size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Reset Filters
            </Link>
          )}
        </div>

        {/* Categories */}
        <div className={styles.filterBox}>
          <h3 className={styles.filterTitle}>Categories</h3>
          <ul className={styles.list}>
            <li>
              <Link
                href={buildUrl({ category: '' })}
                onClick={close}
                className={`${styles.filterLink} ${!activeCategory ? styles.filterLinkActive : ''}`}
              >
                All Categories
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={buildUrl({ category: cat.slug })}
                  onClick={close}
                  className={`${styles.filterLink} ${activeCategory === cat.slug ? styles.filterLinkActive : ''}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Product Types */}
        <div className={styles.filterBox}>
          <h3 className={styles.filterTitle}>Product Types</h3>
          <ul className={styles.list}>
            <li>
              <Link
                href={buildUrl({ type: '' })}
                onClick={close}
                className={`${styles.filterLink} ${!activeType ? styles.filterLinkActive : ''}`}
              >
                All Types
              </Link>
            </li>
            {productTypes.map((type) => (
              <li key={type}>
                <Link
                  href={buildUrl({ type })}
                  onClick={close}
                  className={`${styles.filterLink} ${activeType === type ? styles.filterLinkActive : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {type}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sort */}
        <div className={styles.filterBox}>
          <h3 className={styles.filterTitle}>
            <ArrowUpDown size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary-gold)' }} />
            Sort By
          </h3>
          <ul className={styles.list}>
            <li>
              <Link href={buildUrl({ sort: '' })} onClick={close}
                className={`${styles.filterLink} ${!activeSort ? styles.filterLinkActive : ''}`}>
                Newest Arrivals
              </Link>
            </li>
            <li>
              <Link href={buildUrl({ sort: 'price_asc' })} onClick={close}
                className={`${styles.filterLink} ${activeSort === 'price_asc' ? styles.filterLinkActive : ''}`}>
                Price: Low to High
              </Link>
            </li>
            <li>
              <Link href={buildUrl({ sort: 'price_desc' })} onClick={close}
                className={`${styles.filterLink} ${activeSort === 'price_desc' ? styles.filterLinkActive : ''}`}>
                Price: High to Low
              </Link>
            </li>
          </ul>
        </div>

        {/* Mobile-only apply button */}
        <button type="button" className={styles.applyFiltersBtn} onClick={close}>
          View Results
        </button>
      </aside>
    </>
  );
}
