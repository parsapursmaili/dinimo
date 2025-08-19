"use server";

import { db } from "@/app/lib/db/mysql";
import { revalidatePath } from "next/cache";

// FIX: revalidatePath حذف شد. کامپوننت کلاینت مسئول رفرش کردن است.
export async function deletePost(id) {
  try {
    // ابتدا تمام رکوردهای مرتبط در post_term را حذف کنید
    await db.query("DELETE FROM post_term WHERE object_id = ?", [id]);
    // سپس خود پست را حذف کنید
    await db.query("DELETE FROM posts WHERE id = ?", [id]);
    // revalidatePath("/PostManagement"); // <--- حذف شد
    return { success: true };
  } catch (error) {
    console.error("Delete Post Error:", error);
    return { success: false, error: error.message };
  }
}

// FIX: revalidatePath حذف شد
export async function updatePostStatus(id, status) {
  try {
    await db.query("UPDATE posts SET status = ? WHERE id = ?", [status, id]);
    // revalidatePath("/PostManagement"); // <--- حذف شد
    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, error: error.message };
  }
}

// FIX: revalidatePath و منطق واکشی پست حذف شد
export async function quickEditPost(id, data) {
  const { title, url, status, categories, tags } = data;

  try {
    // ۱. آپدیت اطلاعات اصلی پست
    await db.query(
      "UPDATE posts SET title = ?, url = ?, status = ? WHERE id = ?",
      [title, url, status, id]
    );

    // ۲. مدیریت دسته‌بندی‌ها و تگ‌ها (حذف قدیمی‌ها، افزودن جدیدها)
    // ابتدا تمام دسته‌بندی‌ها و تگ‌های فعلی پست را حذف می‌کنیم
    await db.query("DELETE FROM post_term WHERE object_id = ?", [id]);

    // سپس دسته‌بندی‌های جدید را اضافه می‌کنیم
    if (categories && categories.length > 0) {
      const categoryValues = categories.map((catId) => [
        id,
        parseInt(catId, 10),
      ]);
      await db.query(
        "INSERT INTO post_term (object_id, term_taxonomy_id) VALUES ?",
        [categoryValues]
      );
    }

    // و تگ‌های جدید را اضافه می‌کنیم
    if (tags && tags.length > 0) {
      const tagValues = tags.map((tagId) => [id, parseInt(tagId, 10)]);
      await db.query(
        "INSERT INTO post_term (object_id, term_taxonomy_id) VALUES ?",
        [tagValues]
      );
    }

    // revalidatePath("/PostManagement"); // <--- حذف شد

    // ما نیاز داریم پست آپدیت شده را برگردانیم تا UI بلافاصله آپدیت شود
    // این کار از یک بار رفرش کامل صفحه جلوگیری می‌کند و تجربه کاربری بهتری دارد
    const [[updatedPost]] = await db.query(
      `
      SELECT p.*, 
      GROUP_CONCAT(DISTINCT c.id, ':', c.name SEPARATOR ';') as categories, 
      GROUP_CONCAT(DISTINCT t.id, ':', t.name SEPARATOR ';') as tags,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') as comment_count
      FROM posts p
      LEFT JOIN post_term pt_cat ON p.id = pt_cat.object_id
      LEFT JOIN terms c ON pt_cat.term_taxonomy_id = c.id AND c.taxonomy = 'category'
      LEFT JOIN post_term pt_tag ON p.id = pt_tag.object_id
      LEFT JOIN terms t ON pt_tag.term_taxonomy_id = t.id AND t.taxonomy = 'post_tag'
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [id]
    );

    return { success: true, updatedPost };
  } catch (error) {
    console.error("Quick Edit Error:", error);
    return { success: false, error: error.message };
  }
}
