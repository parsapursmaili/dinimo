"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import debounce from "lodash.debounce";
import {
  createTerm,
  updateTerm,
  deleteTerm,
  searchPosts,
  addPostToTerm,
  removePostFromTerm,
} from "./actions";

// کامپوننت داخلی برای فرم افزودن (بدون تغییر)
function AddTermForm() {
  const formRef = useRef(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAction = async (formData) => {
    setError("");
    startTransition(async () => {
      const result = await createTerm(formData);
      if (result?.success === false) {
        setError(result.message);
      } else {
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="card">
      <form ref={formRef} action={handleAction} className="space-y-6">
        <h1 className="text-center">افزودن ترم جدید</h1>
        {error && (
          <div className="p-3 text-error bg-error-background border border-error-border rounded-md">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block mb-2 font-semibold">
            نام ترم
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="مثال: آموزش Next.js"
            required
          />
        </div>
        <div>
          <label htmlFor="taxonomy" className="block mb-2 font-semibold">
            نوع
          </label>
          <select id="taxonomy" name="taxonomy" defaultValue="category">
            <option value="category">دسته‌بندی</option>
            <option value="post_tag">تگ</option>
          </select>
        </div>
        <button
          type="submit"
          className="button-primary w-full"
          disabled={isPending}
        >
          {isPending ? "در حال افزودن..." : "افزودن و مشاهده"}
        </button>
      </form>
    </div>
  );
}

// کامپوننت اصلی و جامع
export default function TermsManager({ allTerms, selectedTerm, initialPosts }) {
  // --- STATE های عمومی ---
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState("");

  // --- STATE و منطق سایدبار ---
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebarFilter, setSidebarFilter] = useState("all"); // <-- جدید: State برای فیلتر
  const activeTermId = selectedTerm?.id;

  // <-- جدید: منطق فیلتر ترکیبی
  const filteredTerms = allTerms
    .filter((term) => {
      // فیلتر بر اساس نوع (تگ یا دسته)
      if (sidebarFilter === "all") return true;
      return term.taxonomy === sidebarFilter;
    })
    .filter((term) =>
      // فیلتر بر اساس متن جستجو
      term.name.toLowerCase().includes(sidebarSearch.toLowerCase())
    );

  // --- STATE و منطق بخش ویرایش ---
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();
  const [isLinking, startLinkTransition] = useTransition();

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const debouncedSearch = useCallback(
    debounce((query, termId) => {
      if (query.length > 2) {
        startSearchTransition(async () => {
          const results = await searchPosts(query, termId);
          setSearchResults(results);
        });
      } else {
        setSearchResults([]);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (selectedTerm) {
      debouncedSearch(postSearchQuery, selectedTerm.id);
      return () => debouncedSearch.cancel();
    }
  }, [postSearchQuery, selectedTerm, debouncedSearch]);

  const handleUpdate = async (formData) => {
    setError("");
    startUpdateTransition(async () => {
      const result = await updateTerm(formData);
      if (result.success) alert(result.message);
      else setError(result.message);
    });
  };

  const handleDelete = () => {
    if (confirm(`آیا از حذف ترم "${selectedTerm.name}" مطمئن هستید؟`)) {
      startDeleteTransition(() => deleteTerm(selectedTerm.id));
    }
  };

  const handleAddPost = (postId) => {
    startLinkTransition(async () => {
      const result = await addPostToTerm(selectedTerm.id, postId);
      if (result.success) {
        const addedPost = searchResults.find((p) => p.id === postId);
        if (addedPost) {
          setPosts((prev) => [...prev, addedPost]);
          setSearchResults((prev) => prev.filter((p) => p.id !== postId));
        }
      }
    });
  };

  const handleRemovePost = (postId) => {
    startLinkTransition(async () => {
      const result = await removePostFromTerm(selectedTerm.id, postId);
      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    });
  };

  return (
    <div className="flex h-screen">
      <aside className="w-1/3 max-w-sm bg-secondary p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">ترم‌ها</h2>
        <Link
          href="/admin/terms"
          className="button-primary w-full mb-4 block text-center"
        >
          ساخت ترم جدید
        </Link>
        <div className="space-y-4 mb-4">
          <input
            type="text"
            placeholder="جستجوی ترم..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full"
          />
          {/* دراپ‌داون جدید برای فیلتر */}
          <select
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
            className="w-full"
          >
            <option value="all">همه ترم‌ها</option>
            <option value="category">فقط دسته‌بندی‌ها</option>
            <option value="post_tag">فقط تگ‌ها</option>
          </select>
        </div>
        <nav>
          <ul>
            {filteredTerms.map((term) => (
              <li key={term.id}>
                <Link
                  href={`/admin/terms?term_id=${term.id}`}
                  className={`block p-2 rounded-md transition-colors ${
                    term.id == activeTermId
                      ? "!bg-primary !text-background " // <-- این خط اصلاح شد
                      : "hover:!bg-gray-200 dark:hover:!bg-gray-700" // بهبود جزئی برای هاور
                  }`}
                >
                  {term.name}{" "}
                  <span className="text-xs opacity-70">
                    ({term.taxonomy === "category" ? "دسته" : "تگ"})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {/* بخش Main بدون تغییر باقی می‌ماند */}
        <div className="max-w-4xl mx-auto">
          {selectedTerm ? (
            <div className="space-y-12">
              <div className="card">
                <form action={handleUpdate} className="space-y-4">
                  <h2 className="mb-4">ویرایش ترم: {selectedTerm.name}</h2>
                  {error && <p className="text-error">{error}</p>}
                  <input type="hidden" name="id" value={selectedTerm.id} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name">نام ترم</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={selectedTerm.name}
                      />
                    </div>
                    <div>
                      <label htmlFor="url">URL (مسیر)</label>
                      <input
                        id="url"
                        name="url"
                        type="text"
                        defaultValue={selectedTerm.url}
                        style={{ direction: "ltr", textAlign: "right" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-4">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="button-accent"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "در حال حذف..." : "حذف ترم"}
                    </button>
                    <button
                      type="submit"
                      className="button-primary"
                      disabled={isUpdating}
                    >
                      {isUpdating ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </button>
                  </div>
                </form>
              </div>
              <div className="card">
                <h3 className="mb-4">پست‌های مرتبط</h3>
                <ul className="space-y-2 mb-6">
                  {posts.map((post) => (
                    <li
                      key={post.id}
                      className="flex justify-between items-center p-2 bg-secondary rounded-md"
                    >
                      <span>{post.title}</span>
                      <button
                        onClick={() => handleRemovePost(post.id)}
                        className="text-sm text-error hover:underline"
                        disabled={isLinking}
                      >
                        حذف ارتباط
                      </button>
                    </li>
                  ))}
                  {posts.length === 0 && (
                    <p className="text-gray-500">
                      هیچ پستی به این ترم متصل نیست.
                    </p>
                  )}
                </ul>
                <h4 className="mb-2">افزودن پست به ترم</h4>
                <input
                  type="text"
                  placeholder="جستجوی پست برای افزودن..."
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                />
                {isSearching && <p className="text-sm mt-2">در حال جستجو...</p>}
                <ul className="mt-2 space-y-1">
                  {searchResults.map((post) => (
                    <li
                      key={post.id}
                      className="flex justify-between items-center p-2 hover:bg-secondary rounded-md"
                    >
                      <span>{post.title}</span>
                      <button
                        onClick={() => handleAddPost(post.id)}
                        className="text-sm text-primary hover:underline"
                        disabled={isLinking}
                      >
                        افزودن
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <AddTermForm />
          )}
        </div>
      </main>
    </div>
  );
}
