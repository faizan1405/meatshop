'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../common/Providers';
import { getPricingInfo, variantPrice } from '@/lib/pricing';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Set initial selected variant
  useEffect(() => {
    if (product?.variants?.length > 0) {
      // Prefer in-stock variant if possible
      const instock = product.variants.find((v) => v.stockStatus === 'in_stock');
      setSelectedVariant(instock || product.variants[0]);
    }
  }, [product]);

  if (!product) return null;

  const handleVariantChange = (e) => {
    const variantName = e.target.value;
    const found = product.variants.find((v) => v.name === variantName);
    if (found) {
      setSelectedVariant(found);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigating if wrapped in a link (we shouldn't wrap the whole card in a link if buttons are interactive)
    if (selectedVariant) {
      addToCart(product, selectedVariant, 1);
    }
  };

  const isOutOfStock = selectedVariant?.stockStatus === 'out_of_stock';
  const price = Number(selectedVariant?.price) || 0;
  const salePrice = Number(selectedVariant?.salePrice) || 0;

  const hasDiscount = salePrice > 0 && salePrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - salePrice) / price) * 100) : 0;

  // Single source of truth — falls back to "On call" whenever there is no real
  // price, so a ₹0 product can never reach the customer.
  const pricing = getPricingInfo(product);
  const isOnCall = pricing.isOnCall;

  // Calculate starting price display or show "On call"
  const renderPrice = () => {
    if (isOnCall) {
      return <span className={styles.price}>On call</span>;
    }

    if (pricing.pricedVariants.length > 1) {
      return <span className={styles.price}>From ₹{pricing.minPrice}</span>;
    }

    if (hasDiscount) {
      return (
        <>
          <span className={`${styles.price} ${styles.salePrice}`}>₹{salePrice}</span>
          <span className={styles.oldPrice}>₹{price}</span>
        </>
      );
    }

    // Guard: if the selected variant somehow has no price, show the lowest real
    // price for the product rather than ₹0.
    const displayPrice = variantPrice(selectedVariant) > 0 ? variantPrice(selectedVariant) : pricing.minPrice;
    return <span className={styles.price}>₹{displayPrice}</span>;
  };

  return (
    <div className={styles.card}>
      {hasDiscount && !isOnCall && (
        <span className={styles.badge}>
          Save {discountPercent}%
        </span>
      )}
      
      {/* Product Image Wrapper */}
      <Link href={`/product/${product.slug}`} className={styles.imageWrapper}>
        <img 
          src={product.images?.[0] || product.placeholderImage || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80'} 
          alt={product.name}
          className={styles.image}
          loading="lazy"
        />
      </Link>

      {/* Card Content */}
      <div className={styles.content}>
        <span className={styles.categoryName}>
          {product.category?.name || 'Fresh Cuts'}
        </span>
        
        <Link href={`/product/${product.slug}`}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>

        {/* Pack / weight area — fixed slot so prices & buttons stay aligned
            across cards regardless of how many variants a product has. */}
        <div className={styles.variantArea}>
          {product.variants?.length > 1 && !isOnCall && (
            <div className={styles.variantSelector}>
              <label className={styles.selectLabel}>Pack size / weight</label>
              <select
                value={selectedVariant?.name || ''}
                onChange={handleVariantChange}
                className={styles.selectDropdown}
                aria-label="Select pack size or weight"
              >
                {product.variants.map((v) => (
                  <option key={v._id || v.name} value={v.name}>
                    {v.name} {v.stockStatus === 'out_of_stock' ? '(Out of stock)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {product.variants?.length === 1 && !isOnCall && (
            <span className={styles.packPill}>
              Pack: <strong>{product.variants[0].name}</strong>
            </span>
          )}

          {isOnCall && (
            <span className={styles.packPill}>Custom cut · enquire</span>
          )}
        </div>

        {/* Price display */}
        <div className={styles.priceRow}>
          {renderPrice()}
        </div>

        {/* Button Wrapper */}
        <div className={styles.buttonWrapper}>
          {isOnCall ? (
            <a href="tel:9217577006" className={styles.addBtn} style={{ textDecoration: 'none' }}>
              <span>Call to Order</span>
            </a>
          ) : isOutOfStock ? (
            <button className={styles.outOfStockBtn} disabled>
              Out of stock
            </button>
          ) : (
            <button onClick={handleAddToCart} className={styles.addBtn}>
              <ShoppingCart size={16} />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
