// api/getimg/[...path]/route.js

import { NextResponse } from "next/server";
import { join, dirname } from "path"; // 'dirname' را برای گرفتن مسیر پوشه اضافه می‌کنیم
import { stat, readFile, writeFile, mkdir } from "fs/promises"; // 'mkdir' را برای ساخت پوشه اضافه می‌کنیم
import { existsSync, mkdirSync } from "fs";
import mime from "mime-types";
import sharp from "sharp";

// --- ثابت‌های پیکربندی ---

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const CACHE_DIR = join(process.cwd(), "public", "cache"); // مسیر صحیح و خارج از uploads
const MEDIUM_WIDTH = 700;
const QUALITY = 75; // مطابق با کد شما

// --- راه‌اندازی اولیه ---
if (!existsSync(CACHE_DIR)) {
  console.log("Creating cache directory:", CACHE_DIR);
  mkdirSync(CACHE_DIR, { recursive: true });
}

// --- توابع کمکی ---

/**
 * یک فایل تصویر را با هدرهای کشینگ قوی (ETag) به کلاینت ارسال می‌کند.
 * این تابع بدون تغییر باقی می‌ماند.
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
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
      status: 200,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

// --- کنترلر اصلی API (نسخه اصلاح شده) ---

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const sizeTier = url.searchParams.get("size");

    // ۱. ساخت مسیرها با حفظ ساختار زیرپوشه‌ها
    const imagePathArray = params.path.map(decodeURIComponent);
    const originalPath = join(UPLOADS_DIR, ...imagePathArray);

    const originalFilename = imagePathArray[imagePathArray.length - 1];
    const baseName = originalFilename.split(".").slice(0, -1).join(".");

    // مسیر نسبی تصویر (مثلاً 'ahura/test.webp') را برای ساخت مسیر کش استفاده می‌کنیم
    const relativePath = join(...imagePathArray);

    // ۲. تعریف مسیرهای کش با حفظ ساختار پوشه‌ها
    const cachedMediumFilename = `${baseName}-m-q${QUALITY}.webp`;
    const cachedOrigFilename = `${baseName}-orig-q${QUALITY}.webp`;

    // جایگزین کردن نام فایل اصلی با نام فایل کش
    const cachedMediumPath = join(
      CACHE_DIR,
      dirname(relativePath),
      cachedMediumFilename
    );
    const cachedOrigPath = join(
      CACHE_DIR,
      dirname(relativePath),
      cachedOrigFilename
    );

    const requestedPath = sizeTier === "m" ? cachedMediumPath : cachedOrigPath;

    // ۳. تلاش برای ارسال فایل از کش
    const cachedImageResponse = await serveImage(requestedPath, request);
    if (cachedImageResponse) {
      return cachedImageResponse;
    }

    // ۴. خواندن فایل اصلی
    const originalImageBuffer = await readFile(originalPath);

    // ۵. بهینه‌سازی هر دو نسخه به صورت موازی
    const [optimizedOrigBuffer, optimizedMediumBuffer] = await Promise.all([
      sharp(originalImageBuffer).webp({ quality: QUALITY }).toBuffer(),
      sharp(originalImageBuffer)
        .resize({ width: MEDIUM_WIDTH })
        .webp({ quality: QUALITY })
        .toBuffer(),
    ]);

    // ۶. ***مهم‌ترین اصلاح: ساخت زیرپوشه در کش قبل از ذخیره فایل***
    await mkdir(dirname(requestedPath), { recursive: true });

    // ۷. ذخیره هر دو نسخه در پوشه کش به صورت موازی
    await Promise.all([
      writeFile(cachedOrigPath, optimizedOrigBuffer),
      writeFile(cachedMediumPath, optimizedMediumBuffer),
    ]);

    // ۸. ارسال نسخه درخواست شده به کاربر
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
      // این خطا معمولاً یعنی فایل اصلی در پوشه uploads پیدا نشده است
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
