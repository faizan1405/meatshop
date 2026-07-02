'use client';

import React, { useEffect, useRef } from 'react';
import ProductCard from '../product/ProductCard';
import styles from './ProductCarousel.module.css';

export default function ProductCarousel({ products, autoplayInterval = 3000, compact = false }) {
  const carouselRef = useRef(null);

  // Duplicate products if there are few, to ensure it can scroll on large screens
  const displayProducts = products && products.length > 1 && products.length <= 4
    ? [...products, ...products.map(p => ({ ...p, _id: (p._id || '') + '-clone', slug: (p.slug || '') + '-clone' }))]
    : products;

  // Autoplay functionality
  useEffect(() => {
    if (!displayProducts || displayProducts.length <= 1) return;

    let interval;
    const startInterval = () => {
      interval = setInterval(() => {
        if (carouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          // If we reach the end, go back to start, else scroll to next card
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll by one card width approx
            const firstChild = carouselRef.current.children[0];
            const scrollAmount = firstChild ? firstChild.clientWidth + 20 : clientWidth;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, autoplayInterval);
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
  }, [products, autoplayInterval]);

  if (!displayProducts || displayProducts.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselTrack} ref={carouselRef}>
        {displayProducts.map((product) => (
          <div key={product._id || product.slug} className={styles.slide}>
            <ProductCard product={product} compact={compact} />
          </div>
        ))}
      </div>
    </div>
  );
}
