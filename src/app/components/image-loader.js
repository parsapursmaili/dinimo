// ./app/components/image-loader.js
"use client";

export default function myImageLoader({ src, width, quality }) {
  // src اینجا مسیر نسبی فایل است، مثل: "2025/07/my-image.webp"
  const url = `/api/getimg/${src}?w=${width}&q=${quality || 75}`;
  return url;
}
