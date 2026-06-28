import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';

export default async function sitemap() {
  const baseUrl = 'https://porville.com';

  // Static URLs
  const staticPaths = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-and-conditions',
    '/shipping-policy',
    '/refund-policy',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1.0 : 0.8,
  }));

  try {
    await connectDB();

    // Fetch active categories
    const categories = await Category.find({}).lean();
    const categoryPaths = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Fetch active products
    const products = await Product.find({}).lean();
    const productPaths = products.map((prod) => ({
      url: `${baseUrl}/product/${prod.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticPaths, ...categoryPaths, ...productPaths];
  } catch (error) {
    console.error('Sitemap dynamic generation failed, falling back to static routes:', error);
    return staticPaths;
  }
}
export const revalidate = 86400; // Revalidate sitemap cache once daily
