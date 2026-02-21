/** @type {import('next').NextConfig} */
const nextConfig = {
  // Raise the body-size limit for Server Actions (if any are added later)
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

module.exports = nextConfig;
