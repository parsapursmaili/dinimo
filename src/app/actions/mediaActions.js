"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

// مسیر پایه پوشه آپلودها
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * به صورت بازگشتی تمام مسیرهای فایل‌های تصویر را در پوشه آپلود پیدا می‌کند.
 * @param {string} dir - پوشه برای شروع جستجو
 * @returns {Promise<string[]>} - آرایه‌ای از مسیرهای نسبی تصاویر
 */
async function getFilesRecursively(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        return getFilesRecursively(res);
      } else {
        // ۱. فیلتر کردن فایل‌ها فقط برای پسوندهای تصویری رایج
        const imageExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
        if (imageExtensions.test(res)) {
          return path.relative(UPLOADS_DIR, res).replace(/\\/g, "/");
        }
        return null;
      }
    })
  );
  // حذف مقادیر null و صاف کردن آرایه
  return files.flat().filter((file) => file !== null);
}

/**
 * Server Action برای دریافت لیست تمام تصاویر در کتابخانه رسانه.
 */
export async function getMediaLibrary() {
  try {
    // اطمینان از وجود پوشه آپلود برای جلوگیری از خطا
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const allFiles = await getFilesRecursively(UPLOADS_DIR);
    // مرتب‌سازی بر اساس جدیدترین فایل‌ها (اختیاری ولی مفید)
    return allFiles.sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.error("خطا در خواندن کتابخانه رسانه:", error);
    return [];
  }
}

/**
 * Server Action برای حذف یک تصویر مشخص از کتابخانه.
 * @param {string} imagePath - مسیر نسبی تصویر برای حذف (مثال: '2025/08/image.png')
 * @param {string} pathToRevalidate - مسیری که باید کش آن پاک شود
 */
export async function deleteImage(imagePath, pathToRevalidate) {
  if (!imagePath) {
    return { success: false, message: "مسیر فایل نامعتبر است." };
  }

  try {
    const fullPath = path.join(UPLOADS_DIR, imagePath);

    // یک بررسی امنیتی ساده برای جلوگیری از حذف فایل‌های خارج از پوشه آپلود
    if (!fullPath.startsWith(UPLOADS_DIR)) {
      throw new Error("تلاش برای دسترسی به مسیر غیرمجاز.");
    }

    await fs.unlink(fullPath);

    // پاک کردن کش برای به‌روزرسانی فوری UI
    revalidatePath(pathToRevalidate);

    return { success: true };
  } catch (error) {
    console.error(`خطا در حذف فایل ${imagePath}:`, error);
    if (error.code === "ENOENT") {
      return { success: false, message: "فایل مورد نظر یافت نشد." };
    }
    return { success: false, message: "خطای سرور هنگام حذف فایل." };
  }
}
