/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use webpack instead of Turbopack — @tensorflow/tfjs has compatibility
  // issues with Turbopack's module resolution.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Avoid bundling Node-only TFJS backends in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
