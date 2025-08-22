"use server";

import { db } from "@/app/lib/db/mysql";
import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";

/**
 * دریافت اطلاعات یک پست، دسته‌بندی‌ها و تگ‌های آن بر اساس URL
 */
export async function getPostByUrl(url) {
  noStore(); // جلوگیری از کش شدن برای آپدیت بازدید
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
    const [rows] = await db.query(query, [url]);

    if (!rows || rows.length === 0) {
      return null;
    }

    const post = rows[0];
    // افزایش تعداد بازدید
    await db.query("UPDATE posts SET view = view + 1 WHERE id = ?", [post.id]);
    return { ...post, view: post.view + 1 };
  } catch (error) {
    console.error("Database Error (getPostByUrl):", error);
    throw new Error("Failed to fetch post.");
  }
}

/**
 * دریافت کامنت‌های تایید شده یک پست به صورت تودرتو
 */
export async function getComments(postId) {
  noStore();
  try {
    const query = `
      SELECT id, parent_id, author_name, created_at, content
      FROM comments
      WHERE post_id = ? AND status = 'approved'
      ORDER BY created_at DESC
    `;
    const [comments] = await db.query(query, [postId]);

    // ساختار تودرتو برای پاسخ‌ها
    const commentsById = {};
    comments.forEach((comment) => {
      commentsById[comment.id] = { ...comment, replies: [] };
    });

    const nestedComments = [];
    comments.forEach((comment) => {
      if (comment.parent_id && commentsById[comment.parent_id]) {
        // جلوگیری از نمایش کامنت‌های تودرتو در سطح اصلی
        commentsById[comment.parent_id].replies.unshift(
          commentsById[comment.id]
        );
      } else {
        nestedComments.push(commentsById[comment.id]);
      }
    });

    return nestedComments;
  } catch (error) {
    console.error("Database Error (getComments):", error);
    throw new Error("Failed to fetch comments.");
  }
}

/**
 * ثبت یک کامنت جدید (Server Action)
 */
export async function addComment(previousState, formData) {
  const { postId, parentId, author_name, content, author_email, postUrl } =
    Object.fromEntries(formData);

  if (!author_name.trim() || !content.trim()) {
    return {
      success: false,
      message: "نام و متن دیدگاه نمی‌توانند خالی باشند.",
    };
  }

  try {
    const query = `
      INSERT INTO comments (post_id, parent_id, author_name, author_email, content, created_at, status)
      VALUES (?, ?, ?, ?, ?, NOW(), 'pending')
    `;
    await db.query(query, [
      postId,
      parentId || 0,
      author_name,
      author_email,
      content,
    ]);

    // کش صفحه را پاک می‌کنیم تا کامنت جدید (پس از تایید ادمین) نمایش داده شود
    revalidatePath(`/blog/${postUrl}`);

    return {
      success: true,
      message: "دیدگاه شما ثبت شد و پس از تایید نمایش داده خواهد شد.",
    };
  } catch (error) {
    console.error("Database Error (addComment):", error);
    return {
      success: false,
      message: "خطایی در ثبت دیدگاه رخ داد. لطفا دوباره تلاش کنید.",
    };
  }
}
