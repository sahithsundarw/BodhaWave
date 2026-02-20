/** @type {import('next').NextConfig} */
const nextConfig = {
  // Raise the limit so large PDF base64 payloads don't get rejected
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

module.exports = nextConfig;
