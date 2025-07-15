const nextConfig = {
  // Required for static export
  output: 'export',
  
  // Optional: Add a trailing slash to all paths `/about` -> `/about/`
  trailingSlash: true,
  
  // Optional: Change the output directory `out` -> `dist`
  distDir: 'dist',
  
  // Optional: Enable React Strict Mode
  reactStrictMode: true,
  
  // Optional: Configure image optimization (static export requires unoptimized)
  images: {
    unoptimized: true, // Required for static export
    // domains: ['example.com'], // Add external image domains if needed
  },
  
  // Optional: Enable SVG imports
  webpack(config: { module: { rules: { test: RegExp; use: string[]; }[]; }; }) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  
  // Optional: Configure base path if your site is hosted in a subdirectory
  // Only add basePath if the environment variable exists
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/eyeblobs/app'
  })
};

module.exports = nextConfig;