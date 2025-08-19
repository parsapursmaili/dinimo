import { NextResponse } from "next/server";
import { join } from "path";
import { stat, readFile } from "fs/promises";
import mime from "mime-types";

// مسیر اصلی پوشه آپلودها
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

// این تابع کمکی برای خواندن و ارسال فایل، صحیح است و نیازی به تغییر ندارد.
async function serveImage(filePath, request) {
  try {
    const stats = await stat(filePath);
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
    const ifNoneMatch = request.headers.get("if-none-match");

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    const imageBuffer = await readFile(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
      status: 200,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return null; // به این معناست که فایل یافت نشد
    }
    throw error; // سایر خطاها را به بیرون پرتاب می‌کند
  }
}

// ۱. رفع مشکل اصلی: استفاده از پارامتر `params` که خود Next.js فراهم می‌کند
export async function GET(request, { params }) {
  try {
    // `params.path` یک آرایه از بخش‌های مسیر است.
    // مثال: ['2025', '08', '%D9%84%D9%88...webp']
    const imagePathArray = params.path;

    // ۲. دی‌کُد کردن هر بخش از مسیر برای پشتیبانی از نام‌های فارسی
    const decodedImagePathArray = imagePathArray.map((part) =>
      decodeURIComponent(part)
    );

    // ۳. ساخت مسیر کامل فایل روی دیسک
    const fullPath = join(UPLOADS_DIR, ...decodedImagePathArray);

    const response = await serveImage(fullPath, request);

    if (response) {
      return response;
    }

    // اگر `serveImage` مقدار null برگرداند، یعنی فایل یافت نشده است
    return NextResponse.json(
      { error: "تصویر درخواست شده یافت نشد." },
      { status: 404 }
    );
  } catch (error) {
    console.error("خطا در دسترسی به تصویر:", error);
    return NextResponse.json(
      { error: "خطای سرور در دسترسی به تصویر." },
      { status: 500 }
    );
  }
}
