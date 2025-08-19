"use server";

import { db } from "@/app/lib/db/mysql";
import { revalidatePath } from "next/cache";

/**
 * اطلاعات کامل یک پست را بر اساس شناسه آن باز می‌گرداند.
 */
export async function getPostById(id) {
  if (!id) return null;
  try {
    const [rows] = await db.query(
      `
      SELECT p.*,
             GROUP_CONCAT(DISTINCT cat.id SEPARATOR ',') as category_ids,
             GROUP_CONCAT(DISTINCT tag.id SEPARATOR ',') as tag_ids
      FROM posts p
      LEFT JOIN post_term pt_cat ON p.id = pt_cat.object_id
      LEFT JOIN terms cat ON pt_cat.term_taxonomy_id = cat.id AND cat.taxonomy = 'category'
      LEFT JOIN post_term pt_tag ON p.id = pt_tag.object_id
      LEFT JOIN terms tag ON pt_tag.term_taxonomy_id = tag.id AND tag.taxonomy = 'post_tag'
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }
    const post = rows[0];
    post.category_ids = post.category_ids
      ? post.category_ids.split(",").map(Number)
      : [];
    post.tag_ids = post.tag_ids ? post.tag_ids.split(",").map(Number) : [];
    return post;
  } catch (error) {
    console.error("DATABASE ERROR in getPostById:", error);
    return null;
  }
}

/**
 * تمام دسته‌بندی‌ها را برای استفاده در فرم ویرایش باز می‌گرداند.
 */
export async function getAllCategories() {
  try {
    const [categories] = await db.query(
      "SELECT id, name FROM terms WHERE taxonomy = 'category' ORDER BY name ASC"
    );
    return categories;
  } catch (error) {
    console.error("DATABASE ERROR in getAllCategories:", error);
    return [];
  }
}

/**
 * تمام برچسب‌ها را برای استفاده در فرم ویرایش باز می‌گرداند.
 */
export async function getAllTags() {
  try {
    const [tags] = await db.query(
      "SELECT id, name FROM terms WHERE taxonomy = 'post_tag' ORDER BY name ASC"
    );
    return tags;
  } catch (error) {
    console.error("DATABASE ERROR in getAllTags:", error);
    return [];
  }
}

/**
 * یک پست موجود را در دیتابیس به‌روزرسانی می‌کند.
 */
export async function updatePostAction(postId, formData) {
  // ۱. فیلد excerpt از اینجا حذف شده است تا در کوئری استفاده نشود.
  const { title, content, status, slug, featured_image, categories, tags } =
    formData;

  if (!title || !slug) {
    return { success: false, error: "عنوان و آدرس URL الزامی هستند." };
  }

  try {
    await db.query("START TRANSACTION");

    // ۲. کوئری UPDATE نهایی و صحیح بدون ستون excerpt
    await db.query(
      `UPDATE posts SET
                title = ?,
                content = ?,
                status = ?,
                url = ?,
                thumbnail = ?
             WHERE id = ?`,
      [title, content, status, slug, featured_image, postId]
    );

    await db.query("DELETE FROM post_term WHERE object_id = ?", [postId]);

    const termIds = [...(categories || []), ...(tags || [])];
    if (termIds.length > 0) {
      const termValues = termIds.map((termId) => [postId, termId]);
      await db.query(
        "INSERT INTO post_term (object_id, term_taxonomy_id) VALUES ?",
        [termValues]
      );
    }

    await db.query("COMMIT");

    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/edit/${postId}`);

    return { success: true, message: "نوشته با موفقیت به‌روزرسانی شد." };
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("DATABASE ERROR in updatePostAction:", error);
    return { success: false, error: "خطا در به‌روزرسانی نوشته در دیتابیس." };
  }
}
