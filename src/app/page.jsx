import Image from "next/image";
import myImageLoader from "@/app/components/image-loader";

export default function TestImagePage() {
  const imagePath = "ahura/test.webp"; // مسیر تصویر اصلی شما
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
      <span className="text-primary">سلام</span>

      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        تست سیستم بهینه‌سازی تصویر جدید
      </h1>
      <p style={{ lineHeight: "1.6", textAlign: "center" }}>
        این صفحه دو نسخه از یک تصویر را با استفاده از API جدید نمایش می‌دهد. با
        اولین بارگذاری، هر دو نسخه (اصلی و متوسط) ساخته و کش می‌شوند.
      </p>

      {/* --- نمایش نسخه اصلی (فقط بهینه‌سازی شده) --- */}
      <h2
        style={{
          marginTop: "50px",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}
      >
        ۱. نسخه پیش‌فرض (Default)
      </h2>
      <p>
        این تصویر نسخه اصلی است که فقط به فرمت WebP با کیفیت ۷۰ تبدیل شده است.
      </p>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          marginTop: "20px",
          border: "2px dashed #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Image
          loader={myImageLoader}
          alt={imageAlt + " - نسخه اصلی"}
          src={imagePath} // بدون هیچ پارامتری برای دریافت نسخه پیش‌فرض
          fill
          sizes="(max-width: 768px) 100vw, 900px"
          style={{ objectFit: "cover" }}
          priority // برای بارگذاری سریع‌تر تصویر اصلی
        />
      </div>

      {/* --- نمایش نسخه متوسط (Medium) --- */}
      <h2
        style={{
          marginTop: "50px",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}
      >
        ۲. نسخه متوسط (Medium - عرض ۷۰۰ پیکسل)
      </h2>
      <p>
        این تصویر به عرض ۷۰۰ پیکسل تغییر اندازه داده شده و به فرمت WebP با کیفیت
        ۷۰ تبدیل شده است. برای درخواست این نسخه، از `?size=m` در `src` استفاده
        کرده‌ایم.
      </p>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "700px", // برای نمایش بهتر در صفحه
          margin: "20px auto",
          aspectRatio: "16 / 9",
          border: "2px dashed #0070f3",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Image
          loader={myImageLoader}
          alt={imageAlt + " - نسخه متوسط"}
          src={`${imagePath}?size=m`} // با پارامتر size=m
          fill
          sizes="700px" // چون این تصویر همیشه ۷۰۰ پیکسل است
          style={{ objectFit: "cover" }}
        />
      </div>

      <p
        style={{
          marginTop: "40px",
          fontSize: "14px",
          color: "#555",
          textAlign: "center",
        }}
      >
        اگر هر دو تصویر را می‌بینید، سیستم بهینه‌سازی جدید به درستی کار می‌کند.
      </p>
    </div>
  );
}
