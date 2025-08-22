import { db } from "@/app/lib/db/mysql";
import { unstable_noStore as noStore } from "next/cache";

/**
 * دریافت اطلاعات یک پست، دسته‌بندی‌ها و تگ‌های آن بر اساس URL
 * @param {string} url - آدرس یکتای پست
 * @returns {Promise<object|null>} - آبجکت پست یا null در صورت عدم وجود
 */
export async function getPostByUrl(url) {
  // از کش شدن این کوئری جلوگیری می‌کند تا تعداد بازدید همیشه آپدیت شود
  noStore();

  try {
    const query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.content, 
        p.thumbnail, 
        p.date, 
        p.view,
        (SELECT GROUP_CONCAT(t.name SEPARATOR ', ') 
         FROM terms t
         JOIN post_term pt ON t.id = pt.term_taxonomy_id
         WHERE pt.object_id = p.id AND t.taxonomy = 'category') AS categories,
        (SELECT GROUP_CONCAT(t.name SEPARATOR ', ') 
         FROM terms t
         JOIN post_term pt ON t.id = pt.term_taxonomy_id
         WHERE pt.object_id = p.id AND t.taxonomy = 'post_tag') AS tags
      FROM posts p
      WHERE p.url = ? AND p.status = 'publish'
      LIMIT 1
    `;

    // MariaDB/MySQL2 pool.query returns an array, so we destructure it
    const [rows] = await db.query(query, [url]);

    // اگر پستی پیدا نشد، null برگردان
    if (!rows || rows.length === 0) {
      return null;
    }

    const post = rows[0];

    // افزایش تعداد بازدید پست
    await db.query("UPDATE posts SET view = view + 1 WHERE id = ?", [post.id]);

    // برگرداندن پست به همراه تعداد بازدید جدید
    return { ...post, view: post.view + 1 };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch post.");
  }
}
