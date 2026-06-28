'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../common/Providers';
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
  const price = selectedVariant?.price || 0;
  const salePrice = selectedVariant?.salePrice;
  const activePrice = salePrice || price;

  const hasDiscount = salePrice && salePrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - salePrice) / price) * 100) : 0;

  const isOnCall = product.priceType === 'on_call' || product.purchaseMode === 'on_call';

  // Calculate starting price display or show "On call"
  const renderPrice = () => {
    if (isOnCall) {
      return <span className={styles.price}>On call</span>;
    }

    if (product.variants?.length > 1) {
      const activePrices = product.variants.map((v) => v.salePrice || v.price);
      const minPrice = Math.min(...activePrices);
      return <span className={styles.price}>From ₹{minPrice}</span>;
    }

    if (hasDiscount) {
      return (
        <>
          <span className={`${styles.price} ${styles.salePrice}`}>₹{salePrice}</span>
          <span className={styles.oldPrice}>₹{price}</span>
        </>
      );
    }

    return <span className={styles.price}>₹{price}</span>;
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

        {/* Variant Preview */}
        {product.variants?.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-muted)', marginBottom: '8px' }}>
            Pack sizes: {product.variants.map(v => v.name).join(' / ')}
          </div>
        )}

        {/* Variant Dropdown */}
        {product.variants?.length > 1 && !isOnCall && (
          <div className={styles.variantSelector}>
            <label className={styles.selectLabel}>Select weight/pack</label>
            <select 
              value={selectedVariant?.name || ''} 
              onChange={handleVariantChange}
              className={styles.selectDropdown}
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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)', marginBottom: '15px' }}>
            Pack: <strong>{product.variants[0].name}</strong>
          </div>
        )}

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
