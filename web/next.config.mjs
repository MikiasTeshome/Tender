export default {
  experimental: { externalDir: true },
  images: {
    // Listing photos are served from the local /api/photos route.
    localPatterns: [{ pathname: '/api/photos/**' }, { pathname: '/**' }],
  },
};
