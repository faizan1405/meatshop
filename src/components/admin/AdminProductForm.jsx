'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash, Image as ImageIcon, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './AdminProductForm.module.css';

export default function AdminProductForm({ productId }) {
  const router = useRouter();

  // Categories list
  const [categories, setCategories] = useState([]);
  
  // Product Details States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('fresh meat');
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  
  // SEO Details
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Variants Array State
  const [variants, setVariants] = useState([
    { name: '450g', price: '', salePrice: '', stockStatus: 'in_stock', stockQty: '50' }
  ]);

  // Images URLs List State
  const [images, setImages] = useState([]);

  // UI Status
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!productId && name) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
    }
  }, [name, productId]);

  // Fetch Categories and Product Data on mount
  useEffect(() => {
    // 1. Fetch categories
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
          if (data.categories.length > 0 && !category) {
            setCategory(data.categories[0]._id);
          }
        }
      })
      .catch((err) => console.error(err));

    // 2. Fetch product details if editing
    if (productId) {
      fetch(`/api/admin/products/${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const p = data.product;
            setName(p.name);
            setSlug(p.slug);
            setCategory(p.category?._id || p.category || '');
            setDescription(p.description);
            setProductType(p.productType);
            setFeatured(p.featured);
            setBestSeller(p.bestSeller);
            setNewArrival(p.newArrival);
            setSeoTitle(p.seoTitle || '');
            setSeoDescription(p.seoDescription || '');
            setImages(p.images || []);
            setVariants(p.variants.map(v => ({
              ...v,
              price: v.price.toString(),
              salePrice: v.salePrice ? v.salePrice.toString() : '',
              stockQty: v.stockQty.toString()
            })));
          }
        })
        .catch((err) => console.error(err));
    }
  }, [productId]);

  // Image Upload handler converting file to base64
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      for (const file of Array.from(files)) {
        // Read file as base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: reader.result, folder: 'products' }),
              });
              const data = await res.json();
              if (data.success) {
                setImages((prev) => [...prev, data.url]);
                resolve();
              } else {
                reject(new Error(data.message || 'Image upload failed'));
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (error) => reject(error);
        });
      }
      setStatusMessage({ type: 'success', text: 'Images uploaded successfully!' });
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: error.message || 'Image upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Variants state management
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: '', price: '', salePrice: '', stockStatus: 'in_stock', stockQty: '0' }
    ]);
  };

  const handleRemoveVariant = (indexToRemove) => {
    if (variants.length === 1) {
      alert('Products must have at least one variant.');
      return;
    }
    setVariants((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  // Submit product creation/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    // Basic Validation
    if (!name || !slug || !category || !description || images.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please fill in all details and upload at least one image.' });
      setIsSaving(false);
      return;
    }

    // Map variants back to correct type format (Numbers)
    const formattedVariants = variants.map((v) => {
      if (!v.name || !v.price) {
        throw new Error('All variants must have a name/weight and price.');
      }
      return {
        name: v.name,
        price: parseFloat(v.price),
        salePrice: v.salePrice ? parseFloat(v.salePrice) : undefined,
        stockStatus: v.stockStatus,
        stockQty: parseInt(v.stockQty || '0', 10),
      };
    });

    try {
      const endpoint = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const res = await fetch(endpoint, {
        method: 'POST', // Dynamic handlers on server
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          category,
          description,
          productType,
          featured,
          bestSeller,
          newArrival,
          seoTitle,
          seoDescription,
          images,
          variants: formattedVariants,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'Product saved successfully!' });
        setTimeout(() => {
          router.push('/admin/products');
          router.refresh();
        }, 1000);
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to save product.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to connect to backend.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', borderBottom: '1px solid var(--border-cream)', paddingBottom: '12px' }}>
        {productId ? 'Modify Cut Product' : 'Add New Fresh Cut'}
      </h2>

      {statusMessage && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: statusMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
            color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '0.85rem'
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Details */}
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label>Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken Drumsticks skinless"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Slug URL</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="chicken-drumsticks-skinless"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Product Type</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            required
          >
            <option value="fresh meat">Fresh Meat</option>
            <option value="ready to eat">Ready To Eat</option>
            <option value="live stock">Live Stock</option>
            <option value="eggs">Eggs</option>
            <option value="special">Special</option>
          </select>
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label>Product Description</label>
          <textarea
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe freshness, texture, cooking tips, bone composition..."
            required
          />
        </div>
      </div>

      {/* Checkbox tags */}
      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          <span>Featured Product</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={bestSeller}
            onChange={(e) => setBestSeller(e.target.checked)}
          />
          <span>Best Seller</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={newArrival}
            onChange={(e) => setNewArrival(e.target.checked)}
          />
          <span>New Arrival</span>
        </label>
      </div>

      {/* Variants List Section */}
      <div className={styles.variantsSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span className={styles.sectionLabel}>Product Variants & Stock</span>
          <button 
            type="button" 
            onClick={handleAddVariant} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            + Add Variant
          </button>
        </div>

        <div className={styles.variantHeader}>
          <span>Weight/Pills</span>
          <span>Original Price (₹)</span>
          <span>Sale Price (₹)</span>
          <span>Status</span>
          <span>Stock Qty</span>
          <span>Action</span>
        </div>

        {variants.map((v, index) => (
          <div key={index} className={styles.variantRow}>
            <div className={styles.formGroup}>
              <input
                type="text"
                value={v.name}
                onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                placeholder="450g / 1kg / Pieces"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="number"
                value={v.price}
                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                placeholder="Price"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="number"
                value={v.salePrice}
                onChange={(e) => handleVariantChange(index, 'salePrice', e.target.value)}
                placeholder="Sale Price (optional)"
              />
            </div>

            <div className={styles.formGroup}>
              <select
                value={v.stockStatus}
                onChange={(e) => handleVariantChange(index, 'stockStatus', e.target.value)}
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <input
                type="number"
                value={v.stockQty}
                onChange={(e) => handleVariantChange(index, 'stockQty', e.target.value)}
                placeholder="Stock Quantity"
              />
            </div>

            <button
              type="button"
              onClick={() => handleRemoveVariant(index)}
              className={styles.deleteVariantBtn}
              title="Remove Variant"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Image Uploader */}
      <div className={styles.imagesSection}>
        <span className={styles.sectionLabel} style={{ display: 'block', marginBottom: '15px' }}>
          Product Images (Upload to Cloudinary)
        </span>
        <div className={styles.imagesGrid}>
          {images.map((img, idx) => (
            <div key={idx} className={styles.imagePreview}>
              <img src={img} alt={`Preview-${idx}`} />
              <button 
                type="button" 
                onClick={() => handleRemoveImage(idx)} 
                className={styles.removeImageBtn}
              >
                <Trash size={12} />
              </button>
            </div>
          ))}
          
          <label className={styles.uploadPlaceholder}>
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <UploadCloud size={20} />
                <span>Upload Photos</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* SEO Metadata details */}
      <div className={styles.variantsSection}>
        <span className={styles.sectionLabel} style={{ display: 'block', marginBottom: '15px' }}>
          SEO & Meta Details (Search Engine Optimization)
        </span>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label>SEO Title Tag</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="e.g. Antibiotic-free Fresh Chicken Breast Fillets Online"
            />
          </div>

          <div className={styles.formGroup}>
            <label>SEO Meta Description</label>
            <textarea
              rows="3"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Detailed description optimized for Google search results."
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn-gold"
        disabled={isSaving || isUploading}
        style={{ width: '100%', padding: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '20px', display: 'flex', justifyContent: 'center' }}
      >
        {isSaving ? 'Saving Product Details...' : 'Publish Product to Store'}
      </button>
    </form>
  );
}
