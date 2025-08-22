import mysql from "mysql2/promise";

// -----------------------------------------------------------------------------
// ۱. تنظیمات اتصال به دیتابیس
// -----------------------------------------------------------------------------
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "test",
  waitForConnections: true,
  connectionLimit: 100,
};

// -----------------------------------------------------------------------------
// ۲. تابع اصلی برای بازسازی ID ها
// -----------------------------------------------------------------------------
async function fixDatabaseRelations() {
  const connection = await mysql.createConnection(dbConfig);
  console.log("✅ اتصال به دیتابیس برقرار شد.");

  console.log(
    "⚠️ در حال شروع عملیات بازسازی آی‌دی‌ها. لطفاً قبل از اجرای اسکریپت، از دیتابیس خود بک‌آپ گرفته باشید."
  );
  await connection.beginTransaction();

  try {
    // -----------------------------------------------------------------------------
    // مرحله ۱: به روزرسانی جدول comments با استفاده از عنوان پست ها
    // -----------------------------------------------------------------------------
    await connection.execute(
      `ALTER TABLE comments ADD COLUMN post_title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;`
    );

    await connection.execute(
      `
      UPDATE comments c
      JOIN who_posts wp ON c.post_id = wp.ID
      SET c.post_title = wp.post_title;
      `
    );

    const [updateCommentsResult] = await connection.execute(
      `
      UPDATE comments c
      JOIN posts p ON c.post_title = p.title COLLATE utf8mb4_unicode_ci
      SET c.post_id = p.id;
      `
    );
    console.log(
      `✅ تعداد ${updateCommentsResult.affectedRows} ردیف در جدول 'comments' بر اساس عنوان پست به‌روزرسانی شد.`
    );

    // -----------------------------------------------------------------------------
    // مرحله ۲: به روزرسانی جدول post_term با استفاده از عنوان پست ها
    // -----------------------------------------------------------------------------
    await connection.execute(
      `ALTER TABLE post_term ADD COLUMN post_title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;`
    );

    await connection.execute(
      `
      UPDATE post_term pt
      JOIN who_posts wp ON pt.object_id = wp.ID
      SET pt.post_title = wp.post_title;
      `
    );

    const [updatePostTermResult] = await connection.execute(
      `
      UPDATE post_term pt
      JOIN posts p ON pt.post_title = p.title COLLATE utf8mb4_unicode_ci
      SET pt.object_id = p.id;
      `
    );
    console.log(
      `✅ تعداد ${updatePostTermResult.affectedRows} ردیف در جدول 'post_term' بر اساس عنوان پست به‌روزرسانی شد.`
    );

    // -----------------------------------------------------------------------------
    // مرحله ۳: پاکسازی ستون‌های موقت
    // -----------------------------------------------------------------------------
    await connection.execute(`ALTER TABLE comments DROP COLUMN post_title;`);
    await connection.execute(`ALTER TABLE post_term DROP COLUMN post_title;`);
    console.log("✅ ستون‌های موقت با موفقیت حذف شدند.");

    await connection.commit();
    console.log("🎉 عملیات با موفقیت به اتمام رسید و تغییرات اعمال شد.");
  } catch (error) {
    await connection.rollback();
    console.error("❌ خطایی رخ داد، تغییرات به حالت اولیه بازگردانده شدند.");
    console.error("جزئیات خطا:", error);
  } finally {
    connection.end();
    console.log("🔒 اتصال به دیتابیس بسته شد.");
  }
}

// اجرای تابع اصلی
fixDatabaseRelations();
