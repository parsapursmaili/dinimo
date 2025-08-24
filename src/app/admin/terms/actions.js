"use server";

import { db } from "@/app/lib/db/mysql";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * یک URL بهینه برای سئو از روی نام ترم می‌سازد.
 * کاراکترهای غیرمجاز را حذف کرده و فاصله‌ها را با خط تیره جایگزین می‌کند.
 * @param {string} name - نام ورودی ترم.
 * @returns {string} - URL ساخته شده.
 */
function createUrl(name) {
  // محدود کردن طول به حدود ۶۰ کاراکتر برای سئو بهتر
  const trimmedName = name.substring(0, 60);
  return trimmedName
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "") // حذف کاراکترهای غیرمجاز (فارسی و انگلیسی)
    .trim()
    .replace(/\s+/g, "-"); // جایگزینی فاصله‌های متعدد با یک خط تیره
}

/**
 * یک ترم جدید (دسته‌بندی یا تگ) در دیتابیس ایجاد می‌کند.
 * @param {FormData} formData - داده‌های فرم شامل name و taxonomy.
 * @returns {Promise<{success: boolean, message: string}|undefined>} - در صورت خطا، یک آبجکت پیام برمی‌گرداند. در صورت موفقیت، کاربر را ریدایرکت می‌کند.
 */
export async function createTerm(formData) {
  const name = formData.get("name")?.toString();
  const taxonomy = formData.get("taxonomy")?.toString();

  if (!name || !taxonomy) {
    return { success: false, message: "نام و نوع ترم الزامی است." };
  }

  const url = createUrl(name);

  try {
    // بررسی تکراری بودن URL و نوع ترم
    const [existing] = await db.query(
      "SELECT id FROM terms WHERE url = ? AND taxonomy = ?",
      [url, taxonomy]
    );

    if (existing.length > 0) {
      return {
        success: false,
        message: "ترمی با این نام یا URL تکراری وجود دارد.",
      };
    }

    // درج ترم جدید در دیتابیس
    const [result] = await db.query(
      "INSERT INTO terms (name, url, taxonomy) VALUES (?, ?, ?)",
      [name, url, taxonomy]
    );

    // کش صفحه ترم‌ها را بازسازی می‌کند تا سایدبار آپدیت شود
    revalidatePath("/dashboard/terms");

    // کاربر را به صفحه ویرایش ترم جدید هدایت می‌کند
    redirect(`/dashboard/terms?term_id=${result.insertId}`);
  } catch (error) {
    console.error("Server Action Error (createTerm):", error);
    return { success: false, message: "خطای سرور در ساخت ترم." };
  }
}

/**
 * نام و URL یک ترم موجود را ویرایش می‌کند.
 * @param {FormData} formData - داده‌های فرم شامل id, name و url.
 * @returns {Promise<{success: boolean, message: string}>} - یک آبجکت نتیجه عملیات را برمی‌گرداند.
 */
export async function updateTerm(formData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const url = formData.get("url")?.toString();

  if (!id || !name || !url) {
    return { success: false, message: "داده‌های ورودی برای ویرایش ناقص است." };
  }

  try {
    await db.query("UPDATE terms SET name = ?, url = ? WHERE id = ?", [
      name,
      url,
      id,
    ]);

    // کش صفحه ویرایش همین ترم و صفحه اصلی را بازسازی می‌کند
    revalidatePath(`/dashboard/terms?term_id=${id}`);
    revalidatePath("/dashboard/terms");

    return { success: true, message: "ترم با موفقیت ویرایش شد." };
  } catch (error) {
    console.error("Server Action Error (updateTerm):", error);
    return { success: false, message: "خطای سرور در ویرایش ترم." };
  }
}

/**
 * یک ترم را به طور کامل از دیتابیس حذف می‌کند.
 * @param {number} termId - شناسه ترمی که باید حذف شود.
 * @returns {Promise<{success: boolean, message: string}|undefined>} - در صورت خطا، پیام را برمی‌گرداند. در صورت موفقیت، کاربر را ریدایرکت می‌کند.
 */
export async function deleteTerm(termId) {
  if (!termId) {
    return { success: false, message: "شناسه ترم مشخص نشده است." };
  }
  try {
    // ابتدا تمام ارتباطات این ترم با پست‌ها را از جدول واسط حذف می‌کند
    await db.query("DELETE FROM post_term WHERE term_taxonomy_id = ?", [
      termId,
    ]);

    // سپس خود ترم را حذف می‌کند
    await db.query("DELETE FROM terms WHERE id = ?", [termId]);

    // کش صفحه را بازسازی می‌کند
    revalidatePath("/dashboard/terms");

    // کاربر را به صفحه اصلی مدیریت ترم‌ها هدایت می‌کند
    redirect("/dashboard/terms");
  } catch (error) {
    console.error("Server Action Error (deleteTerm):", error);
    return { success: false, message: "خطای سرور در حذف ترم." };
  }
}

/**
 * پست‌هایی را جستجو می‌کند که هنوز به یک ترم خاص متصل نشده‌اند.
 * @param {string} query - عبارت جستجو برای عنوان پست.
 * @param {number} termId - شناسه ترمی که پست‌ها نباید به آن متصل باشند.
 * @returns {Promise<Array<{id: number, title: string}>>} - آرایه‌ای از پست‌های یافت شده.
 */
export async function searchPosts(query, termId) {
  if (!query || query.length < 2) return [];
  try {
    const sql = `
            SELECT id, title FROM posts
            WHERE title LIKE ? AND id NOT IN (
                SELECT object_id FROM post_term WHERE term_taxonomy_id = ?
            )
            LIMIT 10
        `;
    const [posts] = await db.query(sql, [`%${query}%`, termId]);
    return posts;
  } catch (error) {
    console.error("Server Action Error (searchPosts):", error);
    return [];
  }
}

/**
 * یک ارتباط بین پست و ترم در جدول post_term ایجاد می‌کند.
 * @param {number} termId - شناسه ترم.
 * @param {number} postId - شناسه پست.
 * @returns {Promise<{success: boolean, message?: string}>} - نتیجه عملیات.
 */
export async function addPostToTerm(termId, postId) {
  try {
    await db.query(
      "INSERT INTO post_term (object_id, term_taxonomy_id) VALUES (?, ?)",
      [postId, termId]
    );
    revalidatePath(`/dashboard/terms?term_id=${termId}`);
    return { success: true };
  } catch (error) {
    console.error("Server Action Error (addPostToTerm):", error);
    // این خطا معمولاً زمانی رخ می‌دهد که ارتباط از قبل وجود داشته باشد
    return { success: false, message: "خطا در افزودن پست به ترم." };
  }
}

/**
 * ارتباط بین یک پست و ترم را از جدول post_term حذف می‌کند.
 * @param {number} termId - شناسه ترم.
 * @param {number} postId - شناسه پست.
 * @returns {Promise<{success: boolean, message?: string}>} - نتیجه عملیات.
 */
export async function removePostFromTerm(termId, postId) {
  try {
    await db.query(
      "DELETE FROM post_term WHERE object_id = ? AND term_taxonomy_id = ?",
      [postId, termId]
    );
    revalidatePath(`/dashboard/terms?term_id=${termId}`);
    return { success: true };
  } catch (error) {
    console.error("Server Action Error (removePostFromTerm):", error);
    return { success: false, message: "خطا در حذف ارتباط پست از ترم." };
  }
}
