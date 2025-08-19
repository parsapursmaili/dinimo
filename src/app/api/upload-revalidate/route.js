import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

// مسیر پایه برای آپلودها در پوشه public
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * این API Route فقط یک کار انجام می‌دهد: فایل دریافتی را در مسیر
 * public/uploads/YYYY/MM ذخیره می‌کند و مسیر نسبی آن را باز می‌گرداند.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pathToRevalidate = formData.get("pathToRevalidate");

    // --- ۱. اعتبارسنجی اولیه ---
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

    // --- ۲. ایجاد ساختار پوشه (سال/ماه) ---
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // مثال: '08' برای مرداد
    const targetDir = path.join(UPLOAD_DIR, String(year), String(month));

    // ایجاد پوشه‌ها در صورت عدم وجود
    await fs.mkdir(targetDir, { recursive: true });

    // --- ۳. ساخت نام فایل منحصر به فرد و امن ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = path.parse(file.name).name;
    const extension = path.parse(file.name).ext;

    // پاک‌سازی نام اصلی برای سازگاری با URL
    const sanitizedName = originalName
      .replace(/[^a-z0-9_.-]/gi, "-")
      .toLowerCase();

    // افزودن timestamp برای اطمینان از یکتا بودن نام فایل
    const uniqueFileName = `${Date.now()}-${sanitizedName}${extension}`;
    const filePath = path.join(targetDir, uniqueFileName);

    // --- ۴. ذخیره فایل خام در سرور ---
    await fs.writeFile(filePath, buffer);

    // --- ۵. پاک کردن کش برای مسیر مشخص شده ---
    revalidatePath(pathToRevalidate);

    // --- ۶. بازگرداندن مسیر نسبی برای ذخیره در دیتابیس ---
    // این مسیر نسبت به پوشه 'public/uploads' است. مثال: "2025/08/123456-my-image.png"
    const relativePath = path
      .join(String(year), String(month), uniqueFileName)
      .replace(/\\/g, "/");

    return NextResponse.json({
      success: true,
      relativePath: relativePath,
    });
  } catch (error) {
    console.error("خطا در آپلود ساده فایل:", error);
    return NextResponse.json(
      { success: false, message: "خطای داخلی سرور هنگام آپلود فایل." },
      { status: 500 }
    );
  }
}
