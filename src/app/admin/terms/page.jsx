import { db } from "@/app/lib/db/mysql";
import TermsManager from "./terms-manager";

async function getData(termId) {
  // واکشی تمام ترم‌ها برای سایدبار
  const [allTerms] = await db.query(
    "SELECT id, name, taxonomy FROM terms ORDER BY name ASC"
  );

  if (!termId) {
    return { allTerms, selectedTerm: null, initialPosts: [] };
  }

  // واکشی اطلاعات ترم انتخاب شده
  const [[selectedTerm]] = await db.query("SELECT * FROM terms WHERE id = ?", [
    termId,
  ]);

  if (!selectedTerm) {
    // اگر termId معتبر نبود، به حالت پیش‌فرض برمی‌گردیم
    return { allTerms, selectedTerm: null, initialPosts: [] };
  }

  // واکشی پست‌های مرتبط
  const [initialPosts] = await db.query(
    `
    SELECT p.id, p.title FROM posts p
    JOIN post_term pt ON p.id = pt.object_id
    WHERE pt.term_taxonomy_id = ?
  `,
    [termId]
  );

  // Decode URL برای نمایش در فرم
  selectedTerm.url = decodeURIComponent(selectedTerm.url);

  return { allTerms, selectedTerm, initialPosts };
}

export default async function ManageTermsPage({ searchParams }) {
  const { allTerms, selectedTerm, initialPosts } = await getData(
    searchParams.term_id
  );

  return (
    <TermsManager
      allTerms={allTerms}
      selectedTerm={selectedTerm}
      initialPosts={initialPosts}
    />
  );
}
