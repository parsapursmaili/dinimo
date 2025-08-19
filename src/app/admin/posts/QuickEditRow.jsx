// app/PostManagement/QuickEditRow.jsx
"use client";

import { useState } from "react";

export default function QuickEditRow({
  post,
  allCategories,
  allTags,
  onSave,
  onCancel,
  isPending,
}) {
  const [title, setTitle] = useState(post.title);
  const [url, setUrl] = useState(post.url);
  const [status, setStatus] = useState(post.status);

  // Parse initial terms from the string format 'id:name,id:name'
  const parseTerms = (termsString) =>
    termsString ? termsString.split(",").map((t) => t.split(":")[0]) : [];

  const [selectedCategories, setSelectedCategories] = useState(
    parseTerms(post.categories)
  );
  const [selectedTags, setSelectedTags] = useState(parseTerms(post.tags));

  const handleSave = () => {
    onSave(post.id, {
      title,
      url,
      status,
      categories: selectedCategories,
      tags: selectedTags,
    });
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const handleTagChange = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <tr className="bg-[var(--secondary)]">
      <td colSpan="6" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded-md bg-[var(--input-background)] border border-[var(--input-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 rounded-md bg-[var(--input-background)] border border-[var(--input-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">وضعیت</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-md bg-[var(--input-background)] border border-[var(--input-border)]"
            >
              <option value="publish">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="private">خصوصی</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">دسته‌ها</label>
            <div className="max-h-24 overflow-y-auto p-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)]">
              {allCategories.map((cat) => (
                <div key={cat.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`cat-${cat.id}`}
                    checked={selectedCategories.includes(String(cat.id))}
                    onChange={() => handleCategoryChange(String(cat.id))}
                  />
                  <label htmlFor={`cat-${cat.id}`} className="mr-2">
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">تگ‌ها</label>
            <div className="max-h-24 overflow-y-auto p-2 border border-[var(--input-border)] rounded-md bg-[var(--input-background)]">
              {allTags.map((tag) => (
                <div key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(String(tag.id))}
                    onChange={() => handleTagChange(String(tag.id))}
                  />
                  <label htmlFor={`tag-${tag.id}`} className="mr-2">
                    {tag.name}
                  </label>
                </div>
              ))}
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
            {isPending ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </td>
    </tr>
  );
}
