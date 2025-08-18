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
const TARGET_TABLE = "terms"; // جدول مقصد که قرار است آپدیت شود
const SOURCE_TABLE = "taxonomy"; // جدول منبع وردپرس

/**
 * تابع اصلی برای اجرای فرآیند به‌روزرسانی جدول terms
 */
async function updateTermsTaxonomy() {
  let db;
  try {
    // ایجاد اتصال به دیتابیس
    db = await mysql.createPool(dbConfig);
    console.log("✅ با موفقیت به دیتابیس متصل شد.");

    // --- مرحله ۱: افزودن ستون 'taxonomy' به جدول 'terms' در صورت عدم وجود ---
    await addTaxonomyColumn(db);

    // --- مرحله ۲: استخراج و انتقال نوع تاکسونومی‌ها ---
    await transferTaxonomies(db);

    console.log("\n🎉 فرآیند به‌روزرسانی جدول terms با موفقیت به پایان رسید!");
  } catch (error) {
    console.error("\n❌ خطای بحرانی در حین فرآیند:", error.message);
    console.error("اسکریپت متوقف شد.");
  } finally {
    if (db) {
      await db.end();
      console.log("\n🔌 اتصال به دیتابیس بسته شد.");
    }
  }
}

/**
 * ستون 'taxonomy' از نوع ENUM را به جدول مقصد اضافه می‌کند، اگر وجود نداشته باشد.
 * @param {object} db - اتصال دیتابیس
 */
async function addTaxonomyColumn(db) {
  console.log(
    `\n⏳ در حال بررسی جدول '${TARGET_TABLE}' برای وجود ستون 'taxonomy'...`
  );

  try {
    // ابتدا بررسی می‌کنیم که آیا ستون از قبل وجود دارد یا نه
    const [columns] = await db.execute(
      `SHOW COLUMNS FROM \`${TARGET_TABLE}\` LIKE 'taxonomy'`
    );

    if (columns.length > 0) {
      console.log(
        "✅ ستون 'taxonomy' از قبل موجود است. نیازی به تغییر ساختار جدول نیست."
      );
      return;
    }

    // اگر ستون وجود نداشت، آن را اضافه می‌کنیم
    console.log("ℹ️ ستون 'taxonomy' یافت نشد. در حال اضافه کردن آن به جدول...");
    const alterQuery = `
      ALTER TABLE \`${TARGET_TABLE}\`
      ADD COLUMN \`taxonomy\` ENUM('category', 'post_tag', 'other')
      NOT NULL DEFAULT 'other'
      AFTER \`term_id\`; -- یا هر فیلدی که می‌خواهید بعد از آن قرار گیرد
    `;
    await db.execute(alterQuery);
    console.log("✅ ستون 'taxonomy' با موفقیت به جدول اضافه شد.");
  } catch (error) {
    console.error(`❌ خطا در هنگام تغییر جدول '${TARGET_TABLE}':`, error);
    throw error; // اجرای اسکریپت را متوقف می‌کنیم
  }
}

/**
 * نوع تاکسونومی را از جدول منبع خوانده و جدول مقصد را به‌روزرسانی می‌کند.
 * @param {object} db - اتصال دیتابیس
 */
async function transferTaxonomies(db) {
  console.log(`\n⏳ در حال استخراج اطلاعات از جدول '${SOURCE_TABLE}'...`);

  const [termTaxonomies] = await db.execute(
    `SELECT term_id, taxonomy FROM \`${SOURCE_TABLE}\``
  );

  if (termTaxonomies.length === 0) {
    console.log("ℹ️ هیچ رکوردی در جدول منبع برای انتقال یافت نشد.");
    return;
  }

  console.log(
    `🔍 تعداد ${termTaxonomies.length} رکورد یافت شد. شروع فرآیند به‌روزرسانی...`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const item of termTaxonomies) {
    // مشخص کردن مقدار ENUM بر اساس مقدار تاکسونومی وردپرس
    const taxonomyValue =
      item.taxonomy === "category" || item.taxonomy === "post_tag"
        ? item.taxonomy
        : "other";

    try {
      const [result] = await db.execute(
        `UPDATE terms SET taxonomy = ? WHERE id = ?`,
        [taxonomyValue, item.term_id]
      );
      // اگر رکوردی آپدیت شده باشد، شمارنده را افزایش بده
      if (result.affectedRows > 0) {
        successCount++;
      }
    } catch (updateError) {
      errorCount++;
    }
    // نمایش پیشرفت عملیات در یک خط
    process.stdout.write(
      `\r به‌روزرسانی: ${successCount} موفق | ${errorCount} خطا `
    );
  }
  console.log("\n✅ عملیات به‌روزرسانی فیلدهای taxonomy به پایان رسید.");
}

// -----------------------------------------------------------------------------
// ۳. اجرای اسکریپت
// هشدار: حتماً قبل از اجرا از دیتابیس خود یک نسخه پشتیبان تهیه کنید!
// -----------------------------------------------------------------------------
updateTermsTaxonomy();
