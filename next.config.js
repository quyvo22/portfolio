const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  transpilePackages: ["three"],
  webpack: (config) => {
    // react-pdf / pdfjs-dist may reference canvas as optional dependency
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
