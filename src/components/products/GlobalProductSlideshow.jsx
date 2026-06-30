'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './GlobalProductSlideshow.module.css';

export default function GlobalProductSlideshow() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/slideshow');
        const data = await res.json();
        if (isMounted && data.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch slideshow products', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (products.length <= 1 || loading) return;

    let interval;
    const startInterval = () => {
      interval = setInterval(() => {
        if (carouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          // If we reach the end, go back to start, else scroll to next card
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll by one card width approximately (card width + gap)
            const firstChild = carouselRef.current.children[0];
            const scrollAmount = firstChild ? firstChild.clientWidth + 20 : clientWidth;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, 4000);
    };

    startInterval();

    const handleMouseEnter = () => clearInterval(interval);
    const handleMouseLeave = () => startInterval();

    const container = carouselRef.current;
    if (container) {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      container.addEventListener('touchstart', handleMouseEnter, { passive: true });
      container.addEventListener('touchend', handleMouseLeave, { passive: true });
    }

    return () => {
      clearInterval(interval);
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.removeEventListener('touchstart', handleMouseEnter);
        container.removeEventListener('touchend', handleMouseLeave);
      }
    };
  }, [products, loading]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const firstChild = carouselRef.current.children[0];
      const scrollAmount = firstChild ? firstChild.clientWidth + 20 : 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const renderPrice = (product) => {
    const isOnCall = product.priceType === 'on_call' || product.purchaseMode === 'on_call';
    if (isOnCall) {
      return <span className={styles.price}>On call</span>;
    }

    if (!product.variants || product.variants.length === 0) {
      return <span className={styles.price}>View Price</span>;
    }

    if (product.variants.length > 1) {
      const activePrices = product.variants.map((v) => v.salePrice || v.price).filter(p => p !== undefined && p !== null);
      if (activePrices.length > 0) {
        const minPrice = Math.min(...activePrices);
        return <span className={styles.price}>From ₹{minPrice}</span>;
      }
    }

    const firstVariant = product.variants[0];
    const price = firstVariant?.price || 0;
    const salePrice = firstVariant?.salePrice;
    
    if (salePrice && salePrice < price) {
      return (
        <>
          <span className={`${styles.price} ${styles.salePrice}`}>₹{salePrice}</span>
          <span className={styles.oldPrice}>₹{price}</span>
        </>
      );
    }
    return <span className={styles.price}>₹{price}</span>;
  };

  if (!loading && products.length === 0) {
    return null; // Fallback: completely hide if no products available
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Fresh Picks For You</h2>
          <div className={styles.navButtons}>
            <button 
              className={styles.navBtn} 
              onClick={() => scroll('left')}
              aria-label="Previous products"
              disabled={loading}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={styles.navBtn} 
              onClick={() => scroll('right')}
              aria-label="Next products"
              disabled={loading}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className={styles.carousel} ref={carouselRef}>
          {loading ? (
            // Skeleton loaders
            [1, 2, 3, 4].map((i) => (
              <div key={`skeleton-${i}`} className={`${styles.card} ${styles.skeletonCard}`}>
                <div className={styles.skeletonImg}></div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine}></div>
                  <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                  <div className={styles.skeletonBtn}></div>
                </div>
              </div>
            ))
          ) : (
            products.map((product) => (
              <div key={product._id || product.slug} className={styles.card}>
                <Link href={`/product/${product.slug}`} className={styles.imageWrapper} tabIndex="-1">
                  <img 
                    src={product.images?.[0] || product.placeholderImage || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80'} 
                    alt={product.name}
                    className={styles.image}
                    loading="lazy"
                  />
                </Link>
                <div className={styles.content}>
                  <span className={styles.categoryName}>
                    {product.category?.name || 'Fresh Cuts'}
                  </span>
                  <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 className={styles.productName}>{product.name}</h3>
                  </Link>
                  <div className={styles.priceRow}>
                    {renderPrice(product)}
                  </div>
                  <Link href={`/product/${product.slug}`} className={styles.viewBtn}>
                    View Product
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
