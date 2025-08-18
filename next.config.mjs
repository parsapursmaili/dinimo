// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/app/components/image-loader.js",
  },
};

export default nextConfig;
