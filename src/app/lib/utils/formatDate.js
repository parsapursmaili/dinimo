// /app/maddahi/lib/utils/formatDate.js

import moment from "jalali-moment";

/**
 * یک تاریخ میلادی را به فرمت شمسی دلخواه تبدیل می‌کند.
 * این تابع به صورت امن نوشته شده تا از خطای "Invalid Date" جلوگیری کند.
 * @param {string | Date} gregorianDate - تاریخ میلادی ورودی از دیتابیس.
 * @param {string} format - فرمت خروجی مورد نظر. پیش‌فرض: 'jYY/jM/jD'
 * @returns {string} - رشته تاریخ فرمت‌شده شمسی.
 */
export const toShamsi = (gregorianDate, format = "jYY/jM/jD") => {
  // ۱. بررسی ورودی برای جلوگیری از خطا
  if (!gregorianDate) {
    return "";
  }

  try {
    // ۲. راه حل کلیدی: ابتدا تاریخ را به یک شیء Date استاندارد جاوااسکریپت تبدیل می‌کنیم.
    // این کار باعث می‌شود moment فرمت‌های مختلف خروجی MySQL را به درستی بفهمد.
    // سپس locale را مشخصاً برای همین عملیات تنظیم کرده و فرمت‌دهی می‌کنیم.
    return moment(new Date(gregorianDate)).locale("fa").format(format);
  } catch (error) {
    console.error("Date formatting error:", gregorianDate, error);
    return "تاریخ نامعتبر"; // بازگرداندن یک پیام خطا در صورت بروز مشکل
  }
};

/**
 * یک تاریخ را به صورت "زمان گذشته" نمایش می‌دهد (مثلاً: ۲ ساعت پیش).
 * @param {string | Date} gregorianDate - تاریخ میلادی ورودی.
 * @returns {string} - رشته زمان گذشته به فارسی.
 */
export const timeAgo = (gregorianDate) => {
  if (!gregorianDate) {
    return "";
  }
  try {
    // از همان الگوی امن برای این تابع هم استفاده می‌کنیم
    return moment(new Date(gregorianDate)).locale("fa").fromNow();
  } catch (error) {
    console.error("Time ago formatting error:", gregorianDate, error);
    return "تاریخ نامعتبر";
  }
};
