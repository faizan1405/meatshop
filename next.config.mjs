/** @type {import('next').NextConfig} */
const nextConfig = {
  // The terms page lives at /terms-and-conditions. Redirect the shorter
  // /terms path (used in some external links and the expected route list)
  // so it resolves instead of 404ing.
  async redirects() {
    return [
      {
        source: '/terms',
        destination: '/terms-and-conditions',
        permanent: true,
      },
      // The refund and shipping policy pages were renamed to their full,
      // canonical routes. Redirect the old short paths so existing links,
      // bookmarks, and cached search results resolve instead of 404ing.
      { source: '/refund-policy', destination: '/refund-cancellation-policy', permanent: true },
      { source: '/shipping-policy', destination: '/shipping-delivery-policy', permanent: true },
      // The login page lives at /login. Redirect common alternate auth paths
      // so they resolve instead of 404ing. These paths are not real routes and
      // do not collide with NextAuth's /api/auth/* endpoints.
      { source: '/signin', destination: '/login', permanent: false },
      { source: '/auth/signin', destination: '/login', permanent: false },
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/account/login', destination: '/login', permanent: false },
    ];
  },
};

export default nextConfig;
