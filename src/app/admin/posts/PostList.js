"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import FilterComponent from "./FilterComponent";
import Pagination from "./Pagination";
import StatusBadge from "./StatusBadge";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import QuickEditRow from "./QuickEditRow";
import { deletePost, quickEditPost } from "./actions";
import { ChevronUpIcon, ChevronDownIcon } from "./Icons";

export default function PostList({
  initialPosts,
  totalPosts,
  allCategories,
  allTags,
}) {
  console.log("🚀 [CLIENT POSTLIST] Component rendered/re-rendered.", {
    postCount: initialPosts.length,
  });

  const [posts, setPosts] = useState(initialPosts);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // این useEffect state داخلی را با props جدیدی که از سرور می‌آید، همگام می‌کند
  useEffect(() => {
    console.log(
      "🔄 [CLIENT POSTLIST] useEffect triggered. Updating state with new posts."
    );
    setPosts(initialPosts);
    setEditingPostId(null);
    setSelectedPosts([]);
  }, [initialPosts]);

  const handleSort = (sortKey) => {
    const params = new URLSearchParams(searchParams);
    const currentSort = params.get("sort");
    const currentOrder = params.get("order");

    let newOrder = "DESC";
    if (currentSort === sortKey && currentOrder === "DESC") {
      newOrder = "ASC";
    }

    params.set("sort", sortKey);
    params.set("order", newOrder);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const SortableHeader = ({ sortKey, children, className = "" }) => {
    const currentSort = searchParams.get("sort") || "date";
    const currentOrder = searchParams.get("order") || "DESC";
    const isActive = currentSort === sortKey;

    return (
      <th scope="col" className={`px-6 py-3 ${className}`}>
        <button
          onClick={() => handleSort(sortKey)}
          className="flex items-center gap-1.5 group transition-colors hover:text-[var(--accent)]"
        >
          {children}
          <span className="flex flex-col">
            {isActive ? (
              currentOrder === "DESC" ? (
                <ChevronDownIcon className="text-[var(--primary)]" />
              ) : (
                <ChevronUpIcon className="text-[var(--primary)]" />
              )
            ) : (
              <ChevronDownIcon className="opacity-30 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </button>
      </th>
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPosts(posts.map((p) => p.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setSelectedPosts((prev) =>
          prev.filter((selectedId) => selectedId !== id)
        );
      } else {
        alert("خطا در حذف پست: " + result.error);
      }
      setShowDeleteModal(false);
    });
  };

  const openDeleteModal = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (
      confirm(`آیا از حذف ${selectedPosts.length} پست انتخاب شده مطمئن هستید؟`)
    ) {
      startTransition(async () => {
        for (const id of selectedPosts) {
          await deletePost(id);
        }
        setPosts((prev) => prev.filter((p) => !selectedPosts.includes(p.id)));
        setSelectedPosts([]);
      });
    }
  };

  const handleSaveQuickEdit = async (id, data) => {
    startTransition(async () => {
      const result = await quickEditPost(id, data);
      if (result.success && result.updatedPost) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? result.updatedPost : p))
        );
        setEditingPostId(null);
      } else {
        alert("خطا در به‌روزرسانی پست: " + (result.error || "خطای نامشخص"));
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">پست‌ها</h1>
        <Link href="/admin/posts/new" className="button-primary">
          افزودن پست جدید
        </Link>
      </div>

      <div className="card !p-6 border border-transparent dark:border-[var(--input-border)]">
        <FilterComponent
          categories={allCategories}
          tags={allTags}
          postCount={totalPosts}
        />

        <div
          className={`transition-all duration-300 ${
            selectedPosts.length > 0
              ? "h-auto opacity-100 mb-4"
              : "h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="flex items-center gap-4 p-3 bg-[var(--secondary)] rounded-lg border border-[var(--input-border)]">
            <span className="font-semibold">
              {selectedPosts.length} پست انتخاب شده
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="button-primary !bg-[var(--error)] !px-4 !py-1.5 text-sm disabled:opacity-50"
            >
              حذف همه
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
                      posts.length > 0 && selectedPosts.length === posts.length
                    }
                    className="rounded border-[var(--input-border)] bg-[var(--input-background)] focus:ring-[var(--primary)]"
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
              {posts.map((post) =>
                editingPostId === post.id ? (
                  <QuickEditRow
                    key={`edit-${post.id}`}
                    post={post}
                    allCategories={allCategories}
                    allTags={allTags}
                    onSave={handleSaveQuickEdit}
                    onCancel={() => setEditingPostId(null)}
                    isPending={isPending}
                  />
                ) : (
                  <tr
                    key={post.id}
                    className="border-b border-[var(--input-border)] hover:bg-[var(--secondary)] transition-colors group"
                  >
                    <td className="w-4 p-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => handleSelect(post.id)}
                        className="rounded border-[var(--input-border)] bg-[var(--input-background)] focus:ring-[var(--primary)]"
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <Link
                        href={`/admin/posts/edit/${post.id}`}
                        className="hover:text-[var(--accent)] transition-colors"
                      >
                        {post.title}
                      </Link>
                      <div className="text-xs font-normal text-gray-500 space-x-2 space-x-reverse mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => setEditingPostId(post.id)}
                          className="text-[var(--primary)] hover:underline"
                        >
                          ویرایش سریع
                        </button>
                        <span className="text-gray-400 dark:text-gray-600">
                          |
                        </span>
                        <button
                          onClick={() => openDeleteModal(post)}
                          className="text-[var(--error)] hover:underline"
                        >
                          حذف
                        </button>
                        <span className="text-gray-400 dark:text-gray-600">
                          |
                        </span>
                        <a
                          href={`/posts/${post.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          نمایش
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
                )
              )}
            </tbody>
          </table>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            هیچ پستی با این مشخصات یافت نشد.
          </div>
        )}

        <Pagination totalItems={totalPosts} />
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          post={postToDelete}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isPending={isPending}
        />
      )}
    </>
  );
}
