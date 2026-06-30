'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash, Image as ImageIcon, UploadCloud, AlertCircle, CheckCircle, Film, Link as LinkIcon } from 'lucide-react';
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
  const [unitType, setUnitType] = useState('pack_weight');
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // SEO Details
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Variants Array State
  const [variants, setVariants] = useState([
    { name: '450g', price: '', salePrice: '', stockStatus: 'in_stock', stockQty: '50' }
  ]);

  // Images URLs List State
  const [images, setImages] = useState([]);
  // Rich media (images + videos)
  const [media, setMedia] = useState([]);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // UI Status
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const isOnCall = unitType === 'on_call';

  // Placeholder hint for the variant name input, by unit type.
  const variantNamePlaceholder = {
    pack_weight: '450gm / 900gm',
    per_piece: '1 piece / 2 pieces',
    per_kg: '1kg',
    per_tray: '1 tray / 25 pieces',
    on_call: 'Per bird / Per kg',
  }[unitType] || '450gm / 900gm';

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
            // Derive unit type: prefer stored value, fall back to on_call when
            // the product is phone-order only (legacy docs had no unitType).
            setUnitType(p.unitType || ((p.priceType === 'on_call' || p.purchaseMode === 'on_call') ? 'on_call' : 'pack_weight'));
            setFeatured(p.featured);
            setBestSeller(p.bestSeller);
            setNewArrival(p.newArrival);
            setIsActive(p.isActive !== false);
            setSeoTitle(p.seoTitle || '');
            setSeoDescription(p.seoDescription || '');
            setImages(p.images || []);
            setMedia(p.media || []);
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

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, folder: 'porville/videos', resourceType: 'video' }),
        });
        const data = await res.json();
        if (data.success) {
          setMedia((prev) => [...prev, { type: 'video', url: data.url, publicId: data.publicId || '', alt: file.name }]);
          setStatusMessage({ type: 'success', text: 'Video uploaded successfully!' });
        } else {
          setStatusMessage({ type: 'error', text: data.message || 'Video upload failed.' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: err.message || 'Video upload error.' });
      } finally {
        setIsUploadingVideo(false);
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Failed to read video file.' });
      setIsUploadingVideo(false);
    };
  };

  const handleAddVideoUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    setMedia((prev) => [...prev, { type: 'video', url, publicId: '', alt: 'Product video' }]);
    setVideoUrlInput('');
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMedia((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

    try {
      // Validate and format variants — inside try so any error shows to the user.
      // "On call" products may omit prices; everything else needs price > 0.
      for (const v of variants) {
        if (!v.name) {
          setStatusMessage({ type: 'error', text: 'All variants must have a weight/name.' });
          setIsSaving(false);
          return;
        }
        if (!isOnCall && !(parseFloat(v.price) > 0)) {
          setStatusMessage({ type: 'error', text: 'Every variant needs a price greater than 0, or set the unit type to "On call".' });
          setIsSaving(false);
          return;
        }
      }
      const formattedVariants = variants.map((v) => ({
        name: v.name,
        price: isOnCall ? 0 : parseFloat(v.price),
        salePrice: !isOnCall && v.salePrice ? parseFloat(v.salePrice) : undefined,
        stockStatus: v.stockStatus,
        stockQty: parseInt(v.stockQty || '0', 10),
      }));
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
          unitType,
          featured,
          bestSeller,
          newArrival,
          isActive,
          seoTitle,
          seoDescription,
          images,
          media,
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
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Pricing / Unit Type</label>
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            required
          >
            <option value="pack_weight">Pack weight (450gm / 900gm)</option>
            <option value="per_piece">Per piece</option>
            <option value="per_kg">Per kg</option>
            <option value="per_tray">Per tray</option>
            <option value="on_call">On call (no price — Call to Order)</option>
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
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span style={{ fontWeight: 'bold', color: 'var(--primary-gold-dark)' }}>Active on Site</span>
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

        {isOnCall && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff8e1', color: 'var(--primary-gold-dark)', padding: '10px 12px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px' }}>
            <AlertCircle size={16} />
            <span>This product is set to <strong>On call</strong>. Prices are optional and a “Call to Order” button is shown to customers instead of a price.</span>
          </div>
        )}

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
                placeholder={variantNamePlaceholder}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="number"
                value={v.price}
                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                placeholder={isOnCall ? 'On call' : 'Price'}
                required={!isOnCall}
                disabled={isOnCall}
                min="0"
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

      {/* Video / Media Section */}
      <div className={styles.imagesSection}>
        <span className={styles.sectionLabel} style={{ display: 'block', marginBottom: '10px' }}>
          Product Videos
        </span>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dark-muted)', marginBottom: '12px' }}>
          Upload a video file (MP4/MOV) to Cloudinary, or paste a video URL (YouTube, Cloudinary, etc.).
        </p>

        {/* Existing media list */}
        {media.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {media.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: '1px solid var(--border-cream)', borderRadius: '6px', background: '#fafafa' }}>
                <Film size={16} style={{ color: 'var(--primary-gold)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.8rem', wordBreak: 'break-all' }}>{m.url}</span>
                {m.type === 'video' && (
                  <video src={m.url} style={{ height: '50px', width: '80px', objectFit: 'cover', borderRadius: '4px' }} muted />
                )}
                <button type="button" onClick={() => handleRemoveMedia(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload video file */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 14px', border: '1px solid var(--border-cream)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content' }}>
            <UploadCloud size={16} />
            {isUploadingVideo ? 'Uploading Video...' : 'Upload Video File (MP4/MOV)'}
            <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} disabled={isUploadingVideo} />
          </label>

          {/* Or paste URL */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <LinkIcon size={14} style={{ color: 'var(--text-dark-muted)', flexShrink: 0 }} />
            <input
              type="url"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="Or paste a video URL (YouTube embed, Cloudinary, etc.)"
              style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border-cream)', borderRadius: '4px', fontSize: '0.8rem' }}
            />
            <button
              type="button"
              onClick={handleAddVideoUrl}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.75rem', flexShrink: 0 }}
            >
              Add URL
            </button>
          </div>
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
