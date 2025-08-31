"use server";

import { db } from "@/app/lib/db/mysql";
import { revalidatePath } from "next/cache";

/**
 * یک تابع کمکی برای اجرای کوئری‌ها در یک تراکنش دیتابیس.
 * این تابع تضمین می‌کند که یا تمام عملیات با موفقیت انجام می‌شوند (COMMIT)
 * یا در صورت بروز خطا، هیچ‌کدام انجام نمی‌شوند (ROLLBACK).
 * @param {Function} callback - یک تابع async که شامل کوئری‌های دیتابیس است.
 */
async function runInTransaction(callback) {
  try {
    await db.query("START TRANSACTION");
    await callback();
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("DATABASE TRANSACTION FAILED:", error);
    // بازگرداندن یک آبجکت خطا برای نمایش به کاربر
    return { success: false, error: "عملیات دیتابیس با خطا مواجه شد." };
  }
}

/**
 * این یک Server Action است. از سمت کلاینت فراخوانی می‌شود، اما به صورت امن در سرور اجرا می‌شود.
 * این تابع تمام منطق دیتابیس را بر عهده دارد.
 */
export async function getPostsAction(queryString) {
  const params = new URLSearchParams(queryString);
  const page = parseInt(params.get("page") || "1", 10);
  const limit = parseInt(params.get("limit") || "10", 10);
  const search = params.get("search") || "";
  const status = params.get("status") || "";
  const category = params.get("category") || "";
  const tag = params.get("tag") || "";
  const sort = params.get("sort") || "date";
  const order = params.get("order") || "DESC";

  const offset = (page - 1) * limit;

  const allowedSortColumns = {
    title: "p.title",
    date: "p.date",
    view: "p.view",
    status: "p.status",
    comment_count: "comment_count",
  };
  const sortColumn = allowedSortColumns[sort] || "p.date";
  const sortOrder = ["ASC", "DESC"].includes(order.toUpperCase())
    ? order.toUpperCase()
    : "DESC";

  let whereClause = " WHERE 1=1";
  const queryParams = [];
  const joins = [];

  if (search) {
    whereClause += ` AND p.title LIKE ?`;
    queryParams.push(`%${search}%`);
  }
  if (status && ["publish", "draft", "private"].includes(status)) {
    whereClause += ` AND p.status = ?`;
    queryParams.push(status);
  }
  if (category) {
    joins.push(
      `JOIN post_term pt_cat_filter ON p.id = pt_cat_filter.object_id JOIN terms t_cat_filter ON pt_cat_filter.term_taxonomy_id = t_cat_filter.id`
    );
    whereClause += ` AND t_cat_filter.taxonomy = 'category' AND t_cat_filter.name = ?`;
    queryParams.push(category);
  }
  if (tag) {
    joins.push(
      `JOIN post_term pt_tag_filter ON p.id = pt_tag_filter.object_id JOIN terms t_tag_filter ON pt_tag_filter.term_taxonomy_id = t_tag_filter.id`
    );
    whereClause += ` AND t_tag_filter.taxonomy = 'post_tag' AND t_tag_filter.name = ?`;
    queryParams.push(tag);
  }

  const joinString = [...new Set(joins)].join(" ");

  const postsQuery = `
    SELECT p.*,
           GROUP_CONCAT(DISTINCT cat.id, ':', cat.name SEPARATOR ';') as categories,
           GROUP_CONCAT(DISTINCT tag.id, ':', tag.name SEPARATOR ';') as tags,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'publish') as comment_count
    FROM posts p
    LEFT JOIN post_term pt_cat ON p.id = pt_cat.object_id
    LEFT JOIN terms cat ON pt_cat.term_taxonomy_id = cat.id AND cat.taxonomy = 'category'
    LEFT JOIN post_term pt_tag ON p.id = pt_tag.object_id
    LEFT JOIN terms tag ON pt_tag.term_taxonomy_id = tag.id AND tag.taxonomy = 'post_tag'
    ${joinString} ${whereClause}
    GROUP BY p.id ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?
  `;
  const totalQuery = `SELECT COUNT(DISTINCT p.id) as total FROM posts p ${joinString} ${whereClause}`;

  try {
    const [[posts], [[{ total }]], [categories], [tags]] = await Promise.all([
      db.query(postsQuery, [...queryParams, limit, offset]),
      db.query(totalQuery, queryParams),
      db.query(
        "SELECT id, name FROM terms WHERE taxonomy = 'category' ORDER BY name ASC"
      ),
      db.query(
        "SELECT id, name FROM terms WHERE taxonomy = 'post_tag' ORDER BY name ASC"
      ),
    ]);

    return { success: true, data: { posts, total, categories, tags } };
  } catch (error) {
    console.error("DATABASE ERROR in getPostsAction:", error);
    return { success: false, error: "خطا در واکشی اطلاعات از دیتابیس." };
  }
}

/**
 * یک پست را بر اساس شناسه حذف می‌کند.
 */
export async function deletePost(id) {
  const result = await runInTransaction(async () => {
    await db.query("DELETE FROM post_term WHERE object_id = ?", [id]);
    await db.query("DELETE FROM posts WHERE id = ?", [id]);
  });

  if (result) return result; // در صورت بروز خطا در تراکنش، آن را برگردان

  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * چندین پست را به صورت دسته‌جمعی حذف می‌کند.
 */
export async function bulkDeletePosts(ids) {
  if (!ids || ids.length === 0) {
    return { success: false, error: "هیچ شناسه‌ای برای حذف انتخاب نشده است." };
  }
  const placeholders = ids.map(() => "?").join(",");

  const result = await runInTransaction(async () => {
    await db.query(
      `DELETE FROM post_term WHERE object_id IN (${placeholders})`,
      ids
    );
    await db.query(`DELETE FROM posts WHERE id IN (${placeholders})`, ids);
  });

  if (result) return result;

  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * اطلاعات یک پست را با ویرایش سریع به‌روزرسانی می‌کند.
 */
export async function quickEditPost(id, data) {
  const { title, url, status, categories = [], tags = [] } = data;

  if (!title || !url || !status) {
    return {
      success: false,
      error: "عنوان، URL و وضعیت نمی‌توانند خالی باشند.",
    };
  }

  const result = await runInTransaction(async () => {
    await db.query(
      "UPDATE posts SET title = ?, url = ?, status = ? WHERE id = ?",
      [title, url, status, id]
    );

    await db.query("DELETE FROM post_term WHERE object_id = ?", [id]);

    const termIds = [...categories, ...tags]
      .map((termId) => parseInt(termId, 10))
      .filter(Boolean);

    if (termIds.length > 0) {
      const termValues = termIds.map((termId) => [id, termId]);
      await db.query(
        "INSERT INTO post_term (object_id, term_taxonomy_id) VALUES ?",
        [termValues]
      );
    }
  });

  if (result) return result;

  revalidatePath("/admin/posts");
  return { success: true };
}
