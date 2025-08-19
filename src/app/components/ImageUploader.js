"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import myImageLoader from "@/app/components/image-loader";
import MediaLibraryModal from "./MediaLibraryModal";

export default function ImageUploader({
  title,
  imageUrl,
  onImageChange,
  onBusyStateChange,
  revalidatePath,
}) {
  const [preview, setPreview] = useState(imageUrl || null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef(null);

  // همگام‌سازی پیش‌نمایش با پراپرتی ورودی در صورت تغییر از بیرون
  useEffect(() => {
    setPreview(imageUrl);
  }, [imageUrl]);

  const handleBusy = (isBusy) => onBusyStateChange?.(isBusy);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleBusy(true);

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl); // نمایش پیش‌نمایش موقت برای تجربه کاربری بهتر

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pathToRevalidate", revalidatePath);

    try {
      // ۱. مسیر API به آدرس صحیح و نهایی تغییر یافت
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      // بررسی موفقیت‌آمیز بودن پاسخ HTTP
      if (!response.ok) {
        throw new Error(`خطای سرور: ${response.statusText}`);
      }

      const result = await response.json();
      URL.revokeObjectURL(localPreviewUrl);

      if (result.success && result.relativePath) {
        setPreview(result.relativePath);
        onImageChange(result.relativePath);
      } else {
        throw new Error(result.message || "خطای نامشخص در آپلود");
      }
    } catch (error) {
      console.error("خطا در آپلود فایل:", error);
      alert(error.message || "خطا در آپلود");
      setPreview(imageUrl); // بازگشت به تصویر قبلی در صورت بروز خطا
      URL.revokeObjectURL(localPreviewUrl);
    } finally {
      handleBusy(false);
    }
  };

  // تابع اختصاصی برای حذف تصویر
  const handleRemoveImage = () => {
    onImageChange("");
    setPreview(null);
  };

  const handleSelectFromLibrary = (relativePath) => {
    setPreview(relativePath);
    onImageChange(relativePath);
    setIsLibraryOpen(false);
  };

  // کامپوننت داخلی برای نمایش پیش‌نمایش
  const ImagePreview = () => {
    if (!preview) {
      return (
        <div className="w-28 h-28 bg-[var(--secondary)] rounded-md flex items-center justify-center text-center text-xs text-[var(--foreground-muted)] p-2">
          بدون تصویر
        </div>
      );
    }
    return (
      <Image
        loader={myImageLoader}
        src={preview}
        alt={title || "پیش‌نمایش تصویر"}
        width={112}
        height={112}
        className="object-cover rounded-md border border-[var(--input-border)]"
      />
    );
  };

  return (
    <div>
      {/* ۲. برچسب اصلی برای خوانایی و دسترسی‌پذیری بهتر */}
      {title && (
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          {title}
        </label>
      )}
      <div className="mt-1 flex flex-col sm:flex-row items-start gap-4 p-4 border-2 border-dashed border-[var(--input-border)] rounded-lg">
        <ImagePreview />
        <div className="flex flex-col gap-3 flex-grow">
          <div className="flex flex-wrap gap-3">
            {/* ۳. استایل دکمه‌ها برای هماهنگی کامل با تم اصلاح شد */}
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-md bg-[var(--input-background)] border border-[var(--input-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              آپلود جدید
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-md bg-[var(--input-background)] border border-[var(--input-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
              onClick={() => setIsLibraryOpen(true)}
            >
              انتخاب از کتابخانه
            </button>
          </div>
          {preview && (
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-md text-[var(--error)] bg-transparent border border-[var(--error)] hover:bg-[var(--error-background)] transition-colors self-start"
              onClick={handleRemoveImage} // ۴. استفاده از تابع اختصاصی
            >
              حذف تصویر
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/gif"
          />
        </div>
      </div>
      {isLibraryOpen && (
        <MediaLibraryModal
          onClose={() => setIsLibraryOpen(false)}
          onSelectImage={handleSelectFromLibrary}
          revalidatePath={revalidatePath}
        />
      )}
    </div>
  );
}
