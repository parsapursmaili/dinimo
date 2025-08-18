import mysql from "mysql2/promise";

// -----------------------------------------------------------------------------
// ۱. تنظیمات اتصال به دیتابیس
// -----------------------------------------------------------------------------
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "test", // نام دیتابیس خود را اینجا وارد کنید
  waitForConnections: true,
  connectionLimit: 100,
};

// -----------------------------------------------------------------------------
// ۲. نام جداول
// -----------------------------------------------------------------------------
const SOURCE_TABLE = "wp_comments"; // جدول کامنت‌های وردپرس
const TARGET_TABLE = "comments"; // جدول جدید و بهینه شما

/**
 * تابع اصلی برای اجرای فرآیند مهاجرت کامنت‌ها
 */
async function migrateComments() {
  let db;
  try {
    db = await mysql.createPool(dbConfig);
    console.log("✅ با موفقیت به دیتابیس متصل شد.");

    // --- مرحله ۱: ساخت جدول جدید و بهینه 'comments' ---
    await createOptimizedCommentsTable(db);

    // --- مرحله ۲: انتقال داده‌ها از جدول قدیمی به جدید ---
    await transferCommentsData(db);

    console.log("\n🎉 فرآیند مهاجرت کامنت‌ها با موفقیت به پایان رسید!");
  } catch (error) {
    console.error("\n❌ خطای بحرانی در حین فرآیند:", error.message);
  } finally {
    if (db) {
      await db.end();
      console.log("\n🔌 اتصال به دیتابیس بسته شد.");
    }
  }
}

/**
 * جدول جدید و بهینه 'comments' را در صورت عدم وجود ایجاد می‌کند.
 * @param {object} db - اتصال دیتابیس
 */
async function createOptimizedCommentsTable(db) {
  console.log(`\n⏳ در حال بررسی و ساخت جدول جدید '${TARGET_TABLE}'...`);
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${TARGET_TABLE}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`post_id\` INT NOT NULL,
      \`parent_id\` INT NOT NULL DEFAULT 0,
      \`author_name\` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      \`author_email\` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      \`author_url\` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      \`author_ip\` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      \`created_at\` DATETIME NOT NULL,
      \`content\` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      \`status\` ENUM('approved', 'pending', 'spam','trash') NOT NULL DEFAULT 'pending',
      \`user_agent\` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      INDEX \`idx_post_id\` (\`post_id\`),
      INDEX \`idx_parent_id\` (\`parent_id\`)
    );
  `;
  await db.execute(createTableQuery);
  console.log(
    `✅ جدول '${TARGET_TABLE}' با موفقیت ایجاد شد یا از قبل موجود بود.`
  );
}

/**
 * داده‌های کامنت‌ها را از جدول وردپرس به جدول جدید منتقل می‌کند.
 * @param {object} db - اتصال دیتابیس
 */
async function transferCommentsData(db) {
  console.log(`\n⏳ در حال استخراج کامنت‌ها از جدول '${SOURCE_TABLE}'...`);

  // در این کوئری، وضعیت کامنت از 1, 0, 'spam' به ENUM تبدیل می‌شود
  const extractQuery = `
    SELECT
      comment_post_ID,
      comment_author,
      comment_author_email,
      comment_author_url,
      comment_author_IP,
      comment_date_gmt,
      comment_content,
      CASE
        WHEN comment_approved = '1' THEN 'approved'
        WHEN comment_approved = '0' THEN 'pending'
        WHEN comment_approved = 'trash' THEN 'trash'

        ELSE 'spam'
      END AS status,
      comment_parent,
      comment_agent
    FROM \`${SOURCE_TABLE}\`
    WHERE comment_type = 'comment'; -- فقط کامنت‌های واقعی را منتقل می‌کنیم (نه پینگ‌بک‌ها)
  `;

  const [commentsToMigrate] = await db.execute(extractQuery);

  if (commentsToMigrate.length === 0) {
    console.log("ℹ️ هیچ کامنتی برای انتقال یافت نشد.");
    return;
  }

  console.log(
    `🔍 تعداد ${commentsToMigrate.length} کامنت یافت شد. شروع درج در جدول جدید...`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const comment of commentsToMigrate) {
    const newCommentData = {
      post_id: comment.comment_post_ID,
      parent_id: comment.comment_parent,
      author_name: comment.comment_author,
      author_email: comment.comment_author_email,
      author_url: comment.comment_author_url,
      author_ip: comment.comment_author_IP,
      created_at: comment.comment_date_gmt,
      content: comment.comment_content,
      status: comment.status,
      user_agent: comment.comment_agent,
    };

    try {
      await db.query(`INSERT INTO \`${TARGET_TABLE}\` SET ?`, newCommentData);
      successCount++;
    } catch (insertError) {
      errorCount++;
      console.error(
        `\n❌ خطا در درج کامنت برای پست با آیدی ${comment.comment_post_ID}:`,
        insertError.message
      );
    }
    process.stdout.write(
      `\r انتقال: ${successCount} موفق | ${errorCount} خطا `
    );
  }
  console.log("\n✅ عملیات انتقال کامنت‌ها به پایان رسید.");
}

// -----------------------------------------------------------------------------
// ۳. اجرای اسکریپت
// هشدار: حتماً قبل از اجرا از دیتابیس خود یک نسخه پشتیبان تهیه کنید!
// -----------------------------------------------------------------------------
migrateComments();
