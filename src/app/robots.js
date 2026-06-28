export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/*', '/api', '/api/*'],
    },
    sitemap: 'https://porville.com/sitemap.xml',
  };
}
