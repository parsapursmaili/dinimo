// myImageLoader.js
"use client";

export default function myImageLoader({ src }) {
  let finalPath = src;

  // ۱. بررسی اینکه آیا آدرس با http یا https شروع شده است.
  // این یک چک سریع و بهینه است.
  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      // ۲. ایجاد یک URL معتبر از src
      const url = new URL(src);

      // ۳. بررسی مسیر برای تشخیص URL کامل وردپرسی
      if (url.pathname.includes("/uploads/")) {
        // جدا کردن بخش مسیر از "uploads/" به بعد
        const pathAfterUploads = url.pathname.split("/uploads/")[1];

        // حذف ابعاد از نام فایل (مثلا -300x169)
        const parts = pathAfterUploads.split("/");
        const filename = parts.pop();
        const cleanedFilename = filename.replace(/-\d+x\d+\./, ".");
        finalPath = [...parts, cleanedFilename].join("/");
      } else {
        // اگر یک URL کامل بود اما وردپرسی نبود، فقط pathname رو برمی‌گردانیم
        finalPath = url.pathname.slice(1); // slice(1) برای حذف اسلش ابتدایی
      }
    } catch (error) {
      // اگر URL معتبر نبود (مثلاً آدرس نسبی بود)، آن را بدون تغییر رها می‌کنیم.
      finalPath = src;
    }
  }

  // ۴. ارسال آدرس نهایی به API.
  return `/api/getimg/${finalPath}`;
}
