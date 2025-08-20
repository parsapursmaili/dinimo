"use client";

export default function myImageLoader({ src }) {
  // پارامترهای width و quality دیگر مستقیماً توسط این لودر استفاده نمی‌شوند.
  // تمام تنظیمات در API مدیریت می‌شود.

  const [path, queryString] = src.split("?");
  const params = new URLSearchParams(queryString);
  const sizeTier = params.get("size"); // مقدار آن 'm' یا null خواهد بود

  if (sizeTier === "m") {
    return `/api/getimg/${path}?size=m`;
  }

  return `/api/getimg/${path}`;
}
