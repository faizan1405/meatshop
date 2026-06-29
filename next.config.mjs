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
    ];
  },
};

export default nextConfig;
