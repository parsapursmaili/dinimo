import { getPostById, getAllCategories, getAllTags } from "./postActions";
import EditPostClient from "./EditPostClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function EditPostPage({ params }) {
  // ۲. رفع هشدار Next.js: استفاده مستقیم از params.id به جای استخراج آن
  const [postData, categories, tags] = await Promise.all([
    getPostById(params.id), // تغییر در اینجا
    getAllCategories(),
    getAllTags(),
  ]);

  if (!postData) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 antialiased">
      <header className="mb-6">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-2 text-[var(--foreground)] opacity-70 hover:opacity-100 hover:text-[var(--primary)] transition-all"
        >
          <ArrowRight size={20} />
          <span>بازگشت به مدیریت نوشته‌ها</span>
        </Link>
      </header>
      <EditPostClient
        initialPost={postData}
        allCategories={categories}
        allTags={tags}
      />
    </div>
  );
}
