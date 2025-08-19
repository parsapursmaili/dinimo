import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

// ۱. رفع قطعی و نهایی خطا: این خط به طور کامل و صحیح در جای خود قرار دارد.
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// این تنظیمات برای افزایش محدودیت حجم فایل آپلودی ضروری است
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // افزایش محدودیت به ۵ مگابایت
    },
  },
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pathToRevalidate = formData.get("pathToRevalidate");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "فایلی برای آپلود یافت نشد." },
        { status: 400 }
      );
    }
    if (!pathToRevalidate) {
      return NextResponse.json(
        { success: false, message: "مسیر revalidation مشخص نشده است." },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const targetDir = path.join(UPLOADS_DIR, String(year), String(month));

    await fs.mkdir(targetDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());

    const originalName = path.parse(file.name).name;
    const extension = path.parse(file.name).ext;

    // پاک‌سازی نام فایل با پشتیبانی کامل از حروف فارسی و انگلیسی
    const sanitizedBaseName = originalName
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}_.-]/gu, "") // پشتیبانی از یونیکد برای تمام زبان‌ها
      .toLowerCase();

    let finalFileName = `${sanitizedBaseName}${extension}`;
    let filePath = path.join(targetDir, finalFileName);
    let counter = 1;

    // حلقه برای پیدا کردن نام منحصر به فرد در صورت وجود فایل تکراری
    while (true) {
      try {
        await fs.access(filePath);
        finalFileName = `${sanitizedBaseName}-${counter}${extension}`;
        filePath = path.join(targetDir, finalFileName);
        counter++;
      } catch (error) {
        if (error.code === "ENOENT") {
          break; // نام منحصر به فرد پیدا شد
        }
        throw error;
      }
    }

    await fs.writeFile(filePath, buffer);

    revalidatePath(pathToRevalidate);

    const relativePath = path
      .join(String(year), String(month), finalFileName)
      .replace(/\\/g, "/");

    return NextResponse.json({
      success: true,
      relativePath: relativePath,
    });
  } catch (error) {
    console.error("خطا در آپلود فایل:", error);
    return NextResponse.json(
      { success: false, message: "خطای داخلی سرور هنگام آپلود فایل." },
      { status: 500 }
    );
  }
}
