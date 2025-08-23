"use server";

import { db } from "@/app/lib/db/mysql";
import { revalidatePath } from "next/cache";

/**
 * دریافت دیدگاه‌ها بر اساس وضعیت
 * اصلاح شده: اگر وضعیت 'spam' باشد، دیدگاه‌های 'trash' را نیز شامل می‌شود
 */
export async function fetchComments(status) {
  const validStatuses = ["approved", "pending", "spam"];
  let finalStatus = validStatuses.includes(status) ? status : "spam";

  let query = `
    SELECT c.*, p.title as post_title, p.url as post_url
    FROM comments c LEFT JOIN posts p ON c.post_id = p.id
    WHERE c.status = ? ORDER BY c.created_at DESC
  `;
  let params = [finalStatus];

  // اگر تب اسپم فعال بود، دیدگاه‌های حذف شده را هم نشان بده
  if (finalStatus === "spam") {
    query = `
      SELECT c.*, p.title as post_title, p.url as post_url
      FROM comments c LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.status IN (?, ?) ORDER BY c.created_at DESC
    `;
    params = ["spam", "trash"];
  }

  try {
    const [comments] = await db.query(query, params);
    return comments;
  } catch (error) {
    console.error("Server Action Error fetching comments:", error);
    return [];
  }
}

// ... (سایر اکشن‌ها بدون تغییر باقی می‌مانند)

export async function updateCommentsStatus(ids, newStatus) {
  if (!ids || ids.length === 0 || !newStatus)
    throw new Error("Invalid arguments.");
  try {
    await db.query(`UPDATE comments SET status = ? WHERE id IN (?)`, [
      newStatus,
      ids,
    ]);
    revalidatePath("/admin/comments");
  } catch (error) {
    throw new Error("Failed to update comments status.");
  }
}

export async function updateCommentContent(id, content) {
  if (!id || !content) throw new Error("Invalid arguments.");
  try {
    await db.query(`UPDATE comments SET content = ? WHERE id = ?`, [
      content,
      id,
    ]);
    revalidatePath("/admin/comments");
  } catch (error) {
    throw new Error("Failed to update comment content.");
  }
}

export async function deleteCommentsPermanently(ids) {
  if (!ids || ids.length === 0) throw new Error("Invalid arguments.");
  try {
    await db.query(`DELETE FROM comments WHERE id IN (?)`, [ids]);
    revalidatePath("/admin/comments");
  } catch (error) {
    throw new Error("Failed to delete comments permanently.");
  }
}
