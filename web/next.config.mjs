export default {
  experimental: { externalDir: true },
  serverExternalPackages: ['firebase-admin'],
  images: {
    // Listing photos are served from the local /api/photos route.
    localPatterns: [{ pathname: '/api/photos/**' }, { pathname: '/**' }],
  },
};
