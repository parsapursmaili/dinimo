// app/PostManagement/PostListContainer.jsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostList from "./PostList";

// این یک کامپوننت Wrapper است که کلید Suspense را به درستی تولید می‌کند
export default function PostListContainer({
  initialPosts,
  initialTotal,
  allCategories,
  allTags,
}) {
  const searchParams = useSearchParams();

  // ما از هوک useSearchParams برای گرفتن آخرین URL استفاده می‌کنیم
  // و با آن یک کلید کاملاً یکتا و صحیح می‌سازیم.
  const suspenseKey = searchParams.toString();

  console.log(`🔑 [CLIENT CONTAINER] Generating Suspense key: ${suspenseKey}`);

  return (
    <Suspense
      key={suspenseKey}
      fallback={
        <div className="text-center p-10">در حال بارگذاری پست‌ها...</div>
      }
    >
      {/* PostList اکنون داخل Suspense رندر می‌شود */}
      <PostList
        initialPosts={initialPosts}
        totalPosts={initialTotal}
        allCategories={allCategories}
        allTags={allTags}
      />
    </Suspense>
  );
}
