import mysql from "mysql2/promise";

// استفاده از الگوی Singleton برای ایجاد و مدیریت یک Pool دیتابیس
// این تابع دقیقاً همان تابع شماست و نیازی به تغییر ندارد
let dbInstance;

export const getDb = async () => {
  if (!dbInstance) {
    dbInstance = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: "test", // نام دیتابیس خود را اینجا وارد کنید
      waitForConnections: true,
      connectionLimit: 100,
    });
    console.log("Database pool created successfully.");
  }
  return dbInstance;
};

/**
 * این تابع جدول `daily_post_views` را حذف و دوباره با ساختار بهینه ایجاد می‌کند.
 * این جدول برای ثبت شمارش روزانه بازدید پست‌ها استفاده می‌شود.
 */
export const createDailyPostViewsTable = async () => {
  const db = await getDb(); // دریافت Connection Pool

  try {
    // 1. حذف جدول daily_post_views در صورت وجود (برای اجرای چندباره اسکریپت بدون خطا)
    console.log("در حال حذف جدول 'daily_post_views' (در صورت وجود)...");
    await db.query(`DROP TABLE IF EXISTS daily_post_views`);
    console.log("جدول 'daily_post_views' حذف شد.");

    // 2. ایجاد جدول daily_post_views با ساختار بهینه
    console.log("در حال ایجاد جدول 'daily_post_views'...");
    await db.query(`
      CREATE TABLE daily_post_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT unsigned NOT NULL,
        view_date DATE NOT NULL,
        view_count INT DEFAULT 1,


        UNIQUE KEY post_date_unique (post_id, view_date),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    console.log("جدول 'daily_post_views' با موفقیت ایجاد شد.");

    console.log("فرآیند ایجاد جدول بازدیدهای روزانه به پایان رسید. ✅");
  } catch (error) {
    console.error("خطا در هنگام ایجاد جدول 'daily_post_views':", error);
    throw error; // خطا را به بیرون پرتاب می‌کنیم تا در صورت نیاز مدیریت شود
  }
};

// اجرای تابع برای ایجاد جدول
(async () => {
  try {
    await createDailyPostViewsTable();
  } catch (error) {
    console.error("اجرای اسکریپت با شکست مواجه شد.");
  } finally {
    // بستن کانکشن پول پس از اتمام کار
    const db = await getDb();
    if (db) {
      db.end();
      console.log("Database pool closed.");
    }
  }
})();
