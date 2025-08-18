// app/test-image/page.js

import Image from "next/image";
import myImageLoader from "@/app/components/image-loader";
export default function TestImagePage() {
  // این آدرس تصویری است که قرار است بعداً آپلود کنیم.
  // فعلاً این فایل وجود خارجی ندارد!

  const imageAlt = "یک تصویر آزمایشی برای بررسی عملکرد Next.js";

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        تست بهینه‌سازی تصویر در Next.js
      </h1>
      <p style={{ lineHeight: "1.6", textAlign: "center" }}>
        این صفحه برای آزمایش نحوه عملکرد کامپوننت `next/image` در حالت
        production است. ما پروژه را بیلد می‌کنیم در حالی که تصویر زیر هنوز وجود
        ندارد. سپس تصویر را اضافه کرده و صفحه را رفرش می‌کنیم.
      </p>

      <div
        style={{
          marginTop: "40px",
          border: "2px dashed #ccc",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <Image
          loader={myImageLoader}
          alt={imageAlt}
          src={`ahura/test14.webp`}
          width={1200} // ابعاد اصلی (ذاتی) تصویر شما
          height={800} // ابعاد اصلی (ذاتی) تصویر شما
          sizes="(max-width: 768px) 100vw, 900px"
          style={{
            width: "100%", // این استایل باعث واکنش‌گرایی تصویر می‌شود
            height: "auto",
            borderRadius: "4px",
          }}
          priority // برای اینکه تصویر سریع‌تر لود شود
        />
      </div>
      <p
        style={{
          marginTop: "20px",
          fontSize: "14px",
          color: "#555",
          textAlign: "center",
        }}
      >
        اگر تصویر را می‌بینید، یعنی بهینه‌ساز در لحظه (On-demand) به درستی کار
        می‌کند.
      </p>
    </div>
  );
}
