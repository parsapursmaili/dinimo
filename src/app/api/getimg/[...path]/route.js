// src/app/api/getimg/[...path]/route.js

import { NextResponse } from "next/server";
import { join } from "path";
import { stat, readFile } from "fs/promises";
import mime from "mime-types";

// مسیر اصلی پوشه آپلودها
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

// تابع کمکی برای خواندن و ارسال فایل
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
      return null;
    }
    throw error;
  }
}

// راه حل جایگزین
export async function GET(request) {
  try {
    const { pathname } = new URL(request.url);
    const pathParts = pathname.split("/").filter((part) => part !== "");

    // مسیر مورد نظر را از URL استخراج می کنیم
    const startOfPath = pathParts.indexOf("getimg") + 1;
    const imagePathArray = pathParts.slice(startOfPath);

    // ساخت مسیر کامل به فایل
    const fullPath = join(UPLOADS_DIR, ...imagePathArray);

    const response = await serveImage(fullPath, request);

    if (response) {
      return response;
    }

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
