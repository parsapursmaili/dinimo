// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/app/components/image-loader.js",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // افزایش محدودیت به ۵ مگابایت
    },
  },
};

export default nextConfig;
