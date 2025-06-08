module.exports = {
  globDirectory: './',
  globPatterns: [
    'index.html',
    'manifest.json',
    'src/**/*.js',
    'node_modules/phaser/dist/phaser.min.js',
    '*.svg', // Updated to include SVG icons
    'src/assets/**/*.{png,jpg,jpeg,gif,webp,svg}',
    // Include any audio files if they exist
    'src/assets/**/*.{mp3,wav,ogg,m4a}'
  ],
  // Ignore these files
  globIgnores: [
    'generate-icons.html',
    'workbox-config.js',
    'node_modules/**/!(phaser.min.js)',
    '**/*.md',
    '**/test*.html',
    '**/debug*.html',
    '**/smoke*.html',
    '**/collision*.html',
    '**/sprite*.html',
    '**/simple*.html'
  ],
  swDest: 'sw.js',
  runtimeCaching: [
    {
      // Cache the Google Fonts
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },
    {
      // Cache the underlying font files with a cache-first strategy for 1 year.
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      // Fallback to cache for navigation requests
      urlPattern: /^https?:\/\/.*\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
      },
    }
  ],
  // Handle iOS 18 cache storage bug with navigation fallback
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
  ],
  skipWaiting: true,
  clientsClaim: true
}; 