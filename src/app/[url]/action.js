"use server";

import { db } from "@/app/lib/db/mysql";
import { revalidateTag } from "next/cache"; // جایگزین revalidatePath
import { headers } from "next/headers"; // برای خواندن IP و User-Agent
import { isAuthenticated } from "@/app/actions/auth";

/**
 * دریافت اطلاعات یک پست، دسته‌بندی‌ها و تگ‌های آن بر اساس URL.
 * این تابع به صورت خودکار توسط Next.js کش می‌شود.
 */
export async function getPostByUrl(url) {
  try {
    const query = `
      SELECT 
        p.id, p.title, p.description, p.content, 
        p.thumbnail, p.date, p.view,
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
    return rows[0];
  } catch (error) {
    console.error("Database Error (getPostByUrl):", error);
    throw new Error("Failed to fetch post.");
  }
}

/**
 * Server Action برای افزایش بازدید (هم کلی و هم روزانه).
 * این تابع از سمت کلاینت فراخوانی می‌شود و بازدید کاربران لاگین کرده را نمی‌شمارد.
 */
export async function incrementViewCount(postId) {
  try {
    const isUserAuthenticated = await isAuthenticated();
    if (isUserAuthenticated) {
      // اگر کاربر لاگین است، بازدید را نشمار و بدون خطا خارج شو
      return;
    }

    const updateTotalViewQuery =
      "UPDATE posts SET view = view + 1 WHERE id = ?";
    const updateDailyViewQuery = `
      INSERT INTO daily_post_views (post_id, view_date, view_count)
      VALUES (?, CURDATE(), 1)
      ON DUPLICATE KEY UPDATE view_count = view_count + 1
    `;

    // اجرای همزمان هر دو کوئری برای بهینگی
    await Promise.all([
      db.query(updateTotalViewQuery, [postId]),
      db.query(updateDailyViewQuery, [postId]),
    ]);
  } catch (error) {
    console.error("Database Error (incrementViewCount):", error);
  }
}

/**
 * دریافت کامنت‌های یک پست.
 * این تابع نیز به صورت خودکار توسط Next.js کش می‌شود.
 */
export async function getComments(postId) {
  try {
    const query = `
      SELECT id, parent_id, author, date, content
      FROM comments
      WHERE post_ID = ? AND status = 'publish'
      ORDER BY date ASC
    `;
    const [comments] = await db.query(query, [postId]);

    if (!comments || comments.length === 0) {
      return [];
    }

    const commentsById = {};
    comments.forEach((comment) => {
      commentsById[comment.id] = { ...comment, replies: [] };
    });

    const nestedComments = [];
    comments.forEach((comment) => {
      if (comment.parent_id && commentsById[comment.parent_id]) {
        commentsById[comment.parent_id].replies.push(commentsById[comment.id]);
      } else {
        nestedComments.push(commentsById[comment.id]);
      }
    });

    return nestedComments.reverse();
  } catch (error) {
    console.error("Database Error (getComments):", error);
    throw new Error("Failed to fetch comments.");
  }
}

/**
 * ثبت یک کامنت جدید (Server Action) - نسخه پیشرفته با ثبت IP و User-Agent
 */
export async function addComment(previousState, formData) {
  const { postId, parentId, author, content, author_email, postUrl } =
    Object.fromEntries(formData);

  if (!author.trim() || !content.trim()) {
    return {
      success: false,
      message: "نام و متن دیدگاه نمی‌توانند خالی باشند.",
    };
  }

  try {
    // 1. دریافت IP و User Agent از هدرهای درخواست
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "Not Found";
    // این روش برای پیدا کردن IP واقعی کاربر پشت پروکسی (مانند Vercel) بهتر عمل می‌کند
    const ip =
      headersList.get("x-forwarded-for") ??
      headersList.get("x-real-ip") ??
      "Not Found";

    // 2. کوئری INSERT با فیلدهای جدید author_IP و user_agent
    const query = `
      INSERT INTO comments (post_ID, parent_id, author, author_email, author_IP, content, date, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'pending')
    `;
    await db.query(query, [
      postId,
      parentId || 0,
      author,
      author_email,
      ip, // مقدار IP
      content,
      userAgent, // مقدار User Agent
    ]);

    // 3. استفاده از revalidateTag برای نامعتبر کردن کش مربوط به این پست
    // این روش مدرن و توصیه شده در Next.js 15 است.
    revalidateTag(`post:${postUrl}`);

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
