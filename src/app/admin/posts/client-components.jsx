"use client";

import {
  useState,
  useTransition,
  useEffect,
  Fragment,
  useCallback,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Trash2,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import {
  getPostsAction,
  deletePost,
  bulkDeletePosts,
  quickEditPost,
} from "./actions";

// Reusable Components
const StatusBadge = ({ status }) => {
  const statusMap = {
    publish: {
      text: "منتشر شده",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    draft: {
      text: "پیش‌نویس",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
    private: {
      text: "خصوصی",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
  };
  const { text, className } = statusMap[status] || {
    text: status,
    className: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${className}`}
    >
      {text}
    </span>
  );
};

const ConfirmDeleteModal = ({ post, onClose, onConfirm, isPending }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
    <div className="bg-[var(--card-background)] w-full max-w-md p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-bold mb-4">تایید حذف</h2>
      <p>
        آیا از حذف پست <span className="font-bold">"{post.title}"</span> مطمئن
        هستید؟ این عمل غیرقابل بازگشت است.
      </p>
      <div className="flex justify-end gap-4 mt-6">
        <button onClick={onClose} className="button-secondary">
          لغو
        </button>
        <button
          onClick={() => onConfirm(post.id)}
          disabled={isPending}
          className="button-primary !bg-error disabled:opacity-50"
        >
          {isPending ? "در حال حذف..." : "حذف کن"}
        </button>
      </div>
    </div>
  </div>
);

function FilterComponent({ categories, tags, postCount }) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleFilterChange = useDebouncedCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400"
          />
          <input
            type="text"
            placeholder={`جستجو در ${postCount} پست...`}
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full p-2.5 pr-10 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)]"
          />
        </div>
        <select
          onChange={(e) => handleFilterChange("status", e.target.value)}
          defaultValue={searchParams.get("status") || ""}
          className="p-2.5 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)]"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="publish">منتشر شده</option>
          <option value="draft">پیش‌نویس</option>
          <option value="private">خصوصی</option>
        </select>
        <select
          onChange={(e) => handleFilterChange("category", e.target.value)}
          defaultValue={searchParams.get("category") || ""}
          className="p-2.5 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)]"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => handleFilterChange("tag", e.target.value)}
          defaultValue={searchParams.get("tag") || ""}
          className="p-2.5 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)]"
        >
          <option value="">همه تگ‌ها</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function QuickEditRow({
  post,
  allCategories,
  allTags,
  onSave,
  onCancel,
  isPending,
}) {
  const [formData, setFormData] = useState({
    title: post.title,
    url: post.url,
    status: post.status,
    categories: new Set(
      post.categories
        ? post.categories.split(";").map((c) => c.split(":")[0])
        : []
    ),
    tags: new Set(
      post.tags ? post.tags.split(";").map((t) => t.split(":")[0]) : []
    ),
  });

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTermChange = (termSet, id) => {
    const newSet = new Set(formData[termSet]);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setFormData((prev) => ({ ...prev, [termSet]: newSet }));
  };

  const handleSave = () => {
    onSave(post.id, {
      ...formData,
      categories: Array.from(formData.categories),
      tags: Array.from(formData.tags),
    });
  };

  return (
    <tr className="bg-[var(--secondary)]">
      <td colSpan="6" className="p-4">
        <h3 className="text-lg font-semibold mb-4">
          ویرایش سریع: {post.title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 rounded-md bg-[var(--input-background)] border border-[var(--input-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="w-full p-2 rounded-md bg-[var(--input-background)] border border-[var(--input-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">وضعیت</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 rounded-md bg-[var(--input-background)] border border-[var(--input-border)]"
            >
              <option value="publish">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="private">خصوصی</option>
            </select>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">دسته‌ها</label>
              <div className="max-h-32 overflow-y-auto p-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)]">
                {allCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`cat-${cat.id}`}
                      checked={formData.categories.has(String(cat.id))}
                      onChange={() =>
                        handleTermChange("categories", String(cat.id))
                      }
                    />
                    <label htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تگ‌ها</label>
              <div className="max-h-32 overflow-y-auto p-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)]">
                {allTags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`tag-${tag.id}`}
                      checked={formData.tags.has(String(tag.id))}
                      onChange={() => handleTermChange("tags", String(tag.id))}
                    />
                    <label htmlFor={`tag-${tag.id}`}>{tag.name}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="button-secondary">
            لغو
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="button-primary disabled:opacity-50"
          >
            {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({ totalItems }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center mt-6">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 mx-1 rounded-md bg-[var(--secondary)] disabled:opacity-50"
      >
        قبلی
      </button>
      <span className="px-4 py-2">
        صفحه {currentPage} از {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 mx-1 rounded-md bg-[var(--secondary)] disabled:opacity-50"
      >
        بعدی
      </button>
    </div>
  );
}

// Main Client Component
export default function PostManagementClient() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [allCategories, setAllCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [modalInfo, setModalInfo] = useState({ show: false, post: null });
  const [editingPostId, setEditingPostId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPostsAction(searchParams.toString());
    if (result.success) {
      setPosts(result.data.posts);
      setTotal(result.data.total);
      setAllCategories(result.data.categories);
      setAllTags(result.data.tags);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActionAndRefetch = (action, successMsg, errorMsg) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        alert(successMsg);
        fetchData(); // Refetch data on success
      } else {
        alert(`${errorMsg}: ${result.error}`);
      }
    });
  };

  const handleDelete = (id) => {
    handleActionAndRefetch(
      () => deletePost(id),
      "پست با موفقیت حذف شد.",
      "خطا در حذف پست"
    );
    setModalInfo({ show: false, post: null });
  };

  const handleBulkDelete = () => {
    if (selectedPosts.size === 0) return;
    if (
      confirm(`آیا از حذف ${selectedPosts.size} پست انتخاب شده مطمئن هستید؟`)
    ) {
      handleActionAndRefetch(
        () => bulkDeletePosts(Array.from(selectedPosts)),
        `${selectedPosts.size} پست حذف شدند.`,
        "خطا در حذف دسته‌جمعی"
      );
      setSelectedPosts(new Set());
    }
  };

  const handleSaveQuickEdit = (id, data) => {
    handleActionAndRefetch(
      () => quickEditPost(id, data),
      "پست با موفقیت به‌روزرسانی شد.",
      "خطا در ویرایش پست"
    );
    setEditingPostId(null);
  };

  const handleSort = (sortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort");
    const currentOrder = params.get("order");
    let newOrder = "DESC";
    if (currentSort === sortKey && currentOrder === "DESC") newOrder = "ASC";
    params.set("sort", sortKey);
    params.set("order", newOrder);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const SortableHeader = ({ sortKey, children }) => {
    const currentSort = searchParams.get("sort") || "date";
    const currentOrder = searchParams.get("order") || "DESC";
    const isActive = currentSort === sortKey;
    return (
      <th scope="col" className="px-6 py-3">
        <button
          onClick={() => handleSort(sortKey)}
          className="flex items-center gap-1.5 group transition-colors hover:text-[var(--accent)]"
        >
          {children}
          <span className="flex flex-col">
            {isActive ? (
              currentOrder === "DESC" ? (
                <ChevronDown className="text-[var(--primary)]" size={16} />
              ) : (
                <ChevronUp className="text-[var(--primary)]" size={16} />
              )
            ) : (
              <ChevronDown
                className="opacity-30 group-hover:opacity-100 transition-opacity"
                size={16}
              />
            )}
          </span>
        </button>
      </th>
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedPosts(new Set(posts.map((p) => p.id)));
    else setSelectedPosts(new Set());
  };

  const handleSelect = (id) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="text-center p-20 text-lg">در حال بارگذاری پست‌ها...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-20 text-lg text-red-500">خطا: {error}</div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">مدیریت پست‌ها</h1>
        <Link
          href="/admin/posts/edit/0"
          className="button-primary flex items-center gap-2"
        >
          <PlusCircle size={20} /> افزودن پست جدید
        </Link>
      </div>

      <div className="bg-[var(--card-background)] p-6 rounded-lg border border-transparent dark:border-[var(--input-border)]">
        <FilterComponent
          categories={allCategories}
          tags={allTags}
          postCount={total}
        />

        <div
          className={`transition-all duration-300 overflow-hidden ${
            selectedPosts.size > 0 ? "h-auto opacity-100 mb-4" : "h-0 opacity-0"
          }`}
        >
          <div className="flex items-center gap-4 p-3 bg-[var(--secondary)] rounded-lg">
            <span className="font-semibold">
              {selectedPosts.size} پست انتخاب شده
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="button-primary !bg-error !px-3 !py-1 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={16} /> حذف همه
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-xs uppercase bg-[var(--secondary)]">
              <tr>
                <th scope="col" className="p-4">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      posts.length > 0 && selectedPosts.size === posts.length
                    }
                    className="rounded border-gray-300"
                  />
                </th>
                <SortableHeader sortKey="title">عنوان</SortableHeader>
                <SortableHeader sortKey="status">وضعیت</SortableHeader>
                <SortableHeader sortKey="date">تاریخ</SortableHeader>
                <SortableHeader sortKey="view">بازدید</SortableHeader>
                <SortableHeader sortKey="comment_count">نظرات</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <Fragment key={post.id}>
                  {editingPostId === post.id ? (
                    <QuickEditRow
                      post={post}
                      allCategories={allCategories}
                      allTags={allTags}
                      onSave={handleSaveQuickEdit}
                      onCancel={() => setEditingPostId(null)}
                      isPending={isPending}
                    />
                  ) : (
                    <tr className="border-b border-[var(--input-border)] hover:bg-[var(--secondary)] transition-colors group">
                      <td className="w-4 p-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.has(post.id)}
                          onChange={() => handleSelect(post.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        <Link
                          href={`/admin//posts/edit/${post.id}`}
                          className="hover:text-[var(--accent)] transition-colors"
                        >
                          {post.title}
                        </Link>
                        <div className="text-xs font-normal text-gray-500 flex items-center gap-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => setEditingPostId(post.id)}
                            className="text-[var(--primary)] hover:underline"
                          >
                            ویرایش سریع
                          </button>
                          <span>|</span>
                          <button
                            onClick={() =>
                              setModalInfo({ show: true, post: post })
                            }
                            className="text-[var(--error)] hover:underline"
                          >
                            حذف
                          </button>
                          <span>|</span>
                          <a
                            href={`/${post.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            نمایش <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-6 py-4">
                        {new Date(post.date).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4">{post.view}</td>
                      <td className="px-6 py-4">{post.comment_count}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {posts.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-500">
            هیچ پستی با این مشخصات یافت نشد.
          </div>
        )}

        <Pagination totalItems={total} />
      </div>

      {modalInfo.show && (
        <ConfirmDeleteModal
          post={modalInfo.post}
          onClose={() => setModalInfo({ show: false, post: null })}
          onConfirm={handleDelete}
          isPending={isPending}
        />
      )}
    </>
  );
}
