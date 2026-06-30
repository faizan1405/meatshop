'use client';

import React, { useEffect, useRef } from 'react';
import styles from './CategoryCarousel.module.css';

// Slideshow wrapper for the homepage category cards. Mirrors ProductCarousel's
// auto-scroll behaviour but renders whatever category cards are passed as children,
// so the existing card markup/styles from the home page are reused untouched.
export default function CategoryCarousel({ children, autoplayInterval = 3500 }) {
  const carouselRef = useRef(null);
  const slides = React.Children.toArray(children);

  useEffect(() => {
    if (slides.length <= 1) return;

    let interval;
    const startInterval = () => {
      interval = setInterval(() => {
        if (!carouselRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const firstChild = carouselRef.current.children[0];
          const scrollAmount = firstChild ? firstChild.clientWidth + 24 : clientWidth;
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
  }, [slides.length, autoplayInterval]);

  if (slides.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselTrack} ref={carouselRef}>
        {slides.map((child, i) => (
          <div key={i} className={styles.slide}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
