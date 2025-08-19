// این کامپوننت سرور دیگر هیچ کاری جز رندر کردن کامپوننت کلاینت انجام نمی‌دهد.
// این کار تمام خطاهای مربوط به searchParams در سمت سرور را از بین می‌برد.
import PostManagementClient from "./client-components";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 antialiased text-[var(--foreground)]">
      {/* Suspense برای مدیریت حالت لودینگ در سمت کلاینت مفید است */}
      <Suspense
        fallback={
          <div className="text-center p-20 text-lg">در حال آماده‌سازی...</div>
        }
      >
        <PostManagementClient />
      </Suspense>
    </div>
  );
}
