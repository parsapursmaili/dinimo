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
// ۲. تنظیمات کلیدهای متادیتای شما
// -----------------------------------------------------------------------------
const META_KEYS = {
  // کلید متایی که برای شمارش بازدید پست‌ها استفاده می‌شود
  VIEWS: "tie_views",
  // کلید متای توضیحات سئو که توسط افزونه Rank Math ایجاد شده
};

/**
 * تابع اصلی برای اجرای فرآیند مهاجرت از وردپرس
 */
async function migrateFromWordPress() {
  let db;
  try {
    // ایجاد اتصال به دیتابیس
    db = await mysql.createPool(dbConfig);
    console.log("✅ با موفقیت به دیتابیس متصل شد.");

    // --- مرحله ۱: ساخت جدول جدید 'posts' در صورت عدم وجود ---
    await createNewPostsTable(db);

    // --- مرحله ۲: استخراج و انتقال اطلاعات با توجه به فیلدهای دقیق شما ---
    await transferData(db);

    console.log("\n🎉 فرآیند مهاجرت با موفقیت به پایان رسید!");
  } catch (error) {
    console.error("\n❌ خطای بحرانی در حین فرآیند مهاجرت:", error.message);
    console.error("اسکریپت متوقف شد.");
  } finally {
    if (db) {
      await db.end();
      console.log("\n🔌 اتصال به دیتابیس بسته شد.");
    }
  }
}

/**
 * جدول جدید 'posts' را اگر وجود نداشته باشد، ایجاد می‌کند.
 * @param {object} db - اتصال دیتابیس
 */
async function createNewPostsTable(db) {
  console.log("\n⏳ در حال بررسی و ساخت جدول جدید 'posts'...");
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
      content 
      thumbnail VARCHAR(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      date DATETIME,
      status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      view INT DEFAULT 0,
    );
  `;
  await db.execute(createTableQuery);
  console.log("✅ جدول 'posts' با موفقیت ایجاد شد یا از قبل موجود بود.");
}

/**
 * داده‌ها را از جداول وردپرس استخراج کرده و در جدول 'posts' درج می‌کند.
 * @param {object} db - اتصال دیتابیس
 */
async function transferData(db) {
  console.log("\n⏳ در حال استخراج اطلاعات سفارشی‌شده از وردپرس...");

  const extractQuery = `
    SELECT
      p.ID,
      p.post_title AS title,
      p.post_name AS url,
      p.post_date AS date,
      p.post_status AS status,
      p.post_type AS type,

      -- استخراج تعداد بازدید از کلید متای 'tie_views'
      views_meta.meta_value AS view,
      
      -- استخراج مسیر نسبی تصویر شاخص
      thumb_file_meta.meta_value AS thumbnail

    FROM
      who_posts p

      -- جوین برای بازدیدها
      LEFT JOIN who_postmeta views_meta ON p.ID = views_meta.post_id AND views_meta.meta_key = '${META_KEYS.VIEWS}'

      -- جوین‌های زنجیره‌ای برای پیدا کردن مسیر فایل تصویر شاخص
      LEFT JOIN who_postmeta thumb_id_meta ON p.ID = thumb_id_meta.post_id AND thumb_id_meta.meta_key = '_thumbnail_id'
      LEFT JOIN who_postmeta thumb_file_meta ON thumb_id_meta.meta_value = thumb_file_meta.post_id AND thumb_file_meta.meta_key = '_wp_attached_file'
    where p.post_type='post' or p.post_type='page'
  `;

  const [postsToMigrate] = await db.execute(extractQuery);

  if (postsToMigrate.length === 0) {
    console.log("ℹ️ هیچ پستی برای انتقال یافت نشد.");
    return;
  }

  console.log(
    `🔍 تعداد ${postsToMigrate.length} پست برای انتقال یافت شد. شروع درج در جدول جدید...`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const post of postsToMigrate) {
    // آماده‌سازی داده‌ها برای درج بدون هیچ تغییری
    const newPostData = {
      title: post.title,
      url: post.url,
      date: post.date,
      status: post.status,
      type: post.type,
      view: parseInt(post.view, 10) || 0, // تبدیل به عدد یا صفر در صورت نبودن
      thumbnail: post.thumbnail, // مسیر نسبی فایل
    };

    try {
      await db.query("INSERT INTO posts SET ?", newPostData);
      successCount++;
    } catch (insertError) {
      errorCount++;
      // نمایش خطا فقط برای ورودی‌های تکراری (url) یا خطاهای دیگر
      if (insertError.code !== "ER_DUP_ENTRY") {
        console.error(
          `\n❌ خطا در درج پست "${post.title}":`,
          insertError.message
        );
      }
    }
    // نمایش پیشرفت عملیات در یک خط
    process.stdout.write(
      `\r انتقال: ${successCount} موفق | ${errorCount} خطا `
    );
  }
  console.log("\n✅ عملیات درج اطلاعات به پایان رسید.");
}

// -----------------------------------------------------------------------------
// ۳. اجرای اسکریپت
// هشدار: حتماً قبل از اجرا از دیتابیس خود یک نسخه پشتیبان تهیه کنید!
// -----------------------------------------------------------------------------
migrateFromWordPress();
