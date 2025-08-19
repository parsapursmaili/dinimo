// app/PostManagement/page.jsx

import { db } from "@/app/lib/db/mysql";
import PostListContainer from "./PostListContainer"; // کامپوننت جدید

// توابع دریافت داده بدون تغییر باقی می‌مانند
async function getPosts(searchParams) {
  const page = searchParams.page ?? "1";
  const limit = searchParams.limit ?? "10";
  const search = searchParams.search;
  const status = searchParams.status;
  const category = searchParams.category;
  const tag = searchParams.tag;
  const sort = searchParams.sort ?? "date";
  const order = searchParams.order ?? "DESC";

  console.log(
    `✅ [SERVER GETPOSTS] Received Params: page=${page}, status=${status}, sort=${sort}`
  );

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const allowedSortColumns = {
    title: "p.title",
    date: "p.date",
    view: "p.view",
    status: "p.status",
    comment_count: "comment_count",
  };
  const sortColumn = allowedSortColumns[sort] || "p.date";
  const sortOrder = ["ASC", "DESC"].includes(order.toUpperCase())
    ? order.toUpperCase()
    : "DESC";

  let whereClause = " WHERE 1=1";
  const params = [];
  if (search) {
    whereClause += ` AND p.title LIKE ?`;
    params.push(`%${search}%`);
  }
  if (status && ["publish", "draft", "private"].includes(status)) {
    whereClause += ` AND p.status = ?`;
    params.push(status);
    console.log(`🔍 [SERVER GETPOSTS] Status filter applied: ${status}`);
  }
  if (category) {
    whereClause += ` AND EXISTS (SELECT 1 FROM post_term pt JOIN terms t ON pt.term_taxonomy_id = t.id WHERE pt.object_id = p.id AND t.name = ? AND t.taxonomy = 'category')`;
    params.push(category);
  }
  if (tag) {
    whereClause += ` AND EXISTS (SELECT 1 FROM post_term pt JOIN terms t ON pt.term_taxonomy_id = t.id WHERE pt.object_id = p.id AND t.name = ? AND t.taxonomy = 'tag')`;
    params.push(tag);
  }

  const postsQuery = `
    SELECT p.*, GROUP_CONCAT(DISTINCT c.id, ':', c.name SEPARATOR ';') as categories, 
    GROUP_CONCAT(DISTINCT t.id, ':', t.name SEPARATOR ';') as tags,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') as comment_count
    FROM posts p
    LEFT JOIN post_term pt_cat ON p.id = pt_cat.object_id
    LEFT JOIN terms c ON pt_cat.term_taxonomy_id = c.id AND c.taxonomy = 'category'
    LEFT JOIN post_term pt_tag ON p.id = pt_tag.object_id
    LEFT JOIN terms t ON pt_tag.term_taxonomy_id = t.id AND t.taxonomy = 'post_tag'
    ${whereClause} GROUP BY p.id ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?
  `;

  const totalQuery = `SELECT COUNT(DISTINCT p.id) as total FROM posts p ${
    whereClause.split("LEFT JOIN")[0]
  }`;
  const [posts] = await db.query(postsQuery, [
    ...params,
    parseInt(limit, 10),
    offset,
  ]);
  const [[{ total }]] = await db.query(totalQuery, params);

  return { posts, total };
}

async function getTerms() {
  const [categories] = await db.query(
    "SELECT id, name FROM terms WHERE taxonomy = 'category'"
  );
  const [tags] = await db.query(
    "SELECT id, name FROM terms WHERE taxonomy = 'post_tag'"
  );
  return { categories, tags };
}

// کامپوننت صفحه اصلی
export default async function PostManagementPage({ searchParams }) {
  // ما داده‌ها را فقط یک بار در بارگذاری اولیه دریافت می‌کنیم
  const initialData = await getPosts(searchParams);
  const termsData = await getTerms();

  return (
    <div className="p-4 sm:p-6 lg:p-8 antialiased text-[var(--foreground)]">
      {/* تمام منطق به این کانتینر کلاینت منتقل می‌شود */}
      <PostListContainer
        initialPosts={initialData.posts}
        initialTotal={initialData.total}
        allCategories={termsData.categories}
        allTags={termsData.tags}
      />
    </div>
  );
}
