// api/getimg/[...path]/route.js

import { NextResponse } from "next/server";
import { join } from "path";
import { stat, readFile, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import mime from "mime-types";
import sharp from "sharp";

// --- ثابت‌های پیکربندی ---

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const CACHE_DIR = join(process.cwd(), "public", "uploads", "cache");
const MEDIUM_WIDTH = 700;
const QUALITY = 70;

// --- راه‌اندازی اولیه ---
// اطمینان از وجود پوشه کش در اولین اجرا
if (!existsSync(CACHE_DIR)) {
  console.log("Creating cache directory:", CACHE_DIR);
  mkdirSync(CACHE_DIR, { recursive: true });
}

// --- توابع کمکی ---

/**
 * یک فایل تصویر را با هدرهای کشینگ قوی (ETag) به کلاینت ارسال می‌کند.
 * @param {string} filePath - مسیر کامل فایل تصویر.
 * @param {Request} request - آبجکت درخواست ورودی.
 * @returns {Promise<Response|null>} آبجکت Response یا null در صورت عدم وجود فایل.
 */
async function serveImage(filePath, request) {
  try {
    const stats = await stat(filePath);
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
    const ifNoneMatch = request.headers.get("if-none-match");

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 }); // Not Modified
    }

    const imageBuffer = await readFile(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // کش برای یک سال
        ETag: etag,
      },
      status: 200,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return null; // فایل وجود ندارد، اجازه بده منطق اصلی ادامه یابد
    }
    throw error; // خطای دیگر را پرتاب کن
  }
}

// --- کنترلر اصلی API ---

export async function GET(request, { params }) {
  try {
    // ۱. پارس کردن ورودی‌ها
    const url = new URL(request.url);
    const sizeTier = url.searchParams.get("size"); // 'm' or null

    // ۲. ساخت مسیرهای فایل اصلی و فایل‌های کش
    const imagePathArray = params.path.map(decodeURIComponent);
    const originalFilename = imagePathArray[imagePathArray.length - 1];
    const originalPath = join(UPLOADS_DIR, ...imagePathArray);

    const baseName = originalFilename.split(".").slice(0, -1).join(".");

    // نام‌گذاری جدید و استاندارد برای فایل‌های کش
    const cachedMediumFilename = `${baseName}-m-q${QUALITY}.webp`;
    const cachedOrigFilename = `${baseName}-orig-q${QUALITY}.webp`;

    const cachedMediumPath = join(CACHE_DIR, cachedMediumFilename);
    const cachedOrigPath = join(CACHE_DIR, cachedOrigFilename);

    // تعیین فایل مورد نظر بر اساس درخواست
    const requestedPath = sizeTier === "m" ? cachedMediumPath : cachedOrigPath;

    // ۳. تلاش برای ارسال فایل از کش
    const cachedImageResponse = await serveImage(requestedPath, request);
    if (cachedImageResponse) {
      return cachedImageResponse;
    }

    // ۴. اگر کش وجود نداشت: هر دو نسخه را به صورت موازی بساز
    const originalImageBuffer = await readFile(originalPath);

    // استفاده از Promise.all برای اجرای همزمان هر دو عملیات بهینه‌سازی
    const [optimizedOrigBuffer, optimizedMediumBuffer] = await Promise.all([
      // نسخه اصلی: فقط تبدیل فرمت و کیفیت
      sharp(originalImageBuffer).webp({ quality: QUALITY }).toBuffer(),

      // نسخه متوسط: تغییر اندازه، تبدیل فرمت و کیفیت
      sharp(originalImageBuffer)
        .resize({ width: MEDIUM_WIDTH })
        .webp({ quality: QUALITY })
        .toBuffer(),
    ]);

    // ذخیره هر دو نسخه در پوشه کش
    await Promise.all([
      writeFile(cachedOrigPath, optimizedOrigBuffer),
      writeFile(cachedMediumPath, optimizedMediumBuffer),
    ]);

    // ۵. ارسال نسخه درخواست شده به کاربر
    const bufferToSend =
      sizeTier === "m" ? optimizedMediumBuffer : optimizedOrigBuffer;

    return new Response(bufferToSend, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Image processing API error:", error);

    if (error.code === "ENOENT") {
      return NextResponse.json(
        { error: "Original image not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during image processing." },
      { status: 500 }
    );
  }
}
