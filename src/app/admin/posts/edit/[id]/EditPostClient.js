"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/app/components/TiptapEditor";
import ImageUploader from "@/app/components/ImageUploader";
import { updatePostAction } from "./postActions";
import {
  ChevronDown,
  Save,
  Settings,
  Tag,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

const TermSelector = ({ terms, selectedTerms, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredTerms = terms.filter((term) =>
    term.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTerm = (termId) => {
    const newSelected = selectedTerms.includes(termId)
      ? selectedTerms.filter((id) => id !== termId)
      : [...selectedTerms, termId];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="border border-[var(--input-border)] rounded-md bg-[var(--input-background)]">
        <div
          className="p-2 flex flex-wrap gap-1 min-h-[42px] cursor-text"
          onClick={() => setIsOpen(true)}
        >
          {selectedTerms.map((id) => {
            const term = terms.find((t) => t.id === id);
            return (
              <span
                key={id}
                className="bg-[var(--primary)] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5"
              >
                {term?.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTerm(id);
                  }}
                  className="hover:text-red-300"
                >
                  ×
                </button>
              </span>
            );
          })}
          <input
            type="text"
            placeholder={selectedTerms.length === 0 ? "افزودن..." : ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="flex-grow bg-transparent focus:outline-none p-1"
          />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-[var(--background)] border border-[var(--input-border)] rounded-md shadow-lg max-h-56 overflow-y-auto">
          <ul>
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => (
                <li
                  key={term.id}
                  className={`p-2 cursor-pointer hover:bg-[var(--secondary)] ${
                    selectedTerms.includes(term.id)
                      ? "font-bold text-[var(--primary)]"
                      : ""
                  }`}
                  onClick={() => {
                    toggleTerm(term.id);
                    setSearchTerm("");
                  }}
                >
                  {term.name}
                </li>
              ))
            ) : (
              <li className="p-2 text-sm text-[var(--foreground-muted)]">
                موردی یافت نشد.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const SidebarSection = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--input-border)] rounded-lg bg-[var(--background)]">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 bg-[var(--secondary)] hover:opacity-80"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={18}
        />
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

export default function EditPostClient({
  initialPost,
  allCategories,
  allTags,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    title: initialPost.title || "",
    content: initialPost.content || "",
    slug: initialPost.url || "",
    status: initialPost.status || "draft",
    featuredImage: initialPost.thumbnail || "",
    selectedCategories: initialPost.category_ids || [],
    selectedTags: initialPost.tag_ids || [],
    excerpt: initialPost.excerpt || "",
  });
  const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus({ message: "در حال ارسال...", type: "pending" });

    // ۱. رفع خطای ReferenceError: تعریف متغیر dataToSend قبل از استفاده
    const dataToSend = {
      title: formData.title,
      content: formData.content,
      slug: formData.slug,
      status: formData.status,
      featured_image: formData.featuredImage,
      categories: formData.selectedCategories,
      tags: formData.selectedTags,
      excerpt: formData.excerpt, // این فیلد ارسال می‌شود اما در اکشن سرور استفاده نمی‌شود تا خطا ندهد
    };

    startTransition(async () => {
      const result = await updatePostAction(initialPost.id, dataToSend);
      if (result.success) {
        setSubmitStatus({ message: result.message, type: "success" });
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setSubmitStatus({ message: result.error, type: "error" });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--input-border)]">
          <input
            id="post-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleFormChange("title", e.target.value)}
            placeholder="عنوان نوشته را اینجا وارد کنید"
            className="w-full text-2xl font-bold bg-transparent focus:outline-none"
            required
          />
        </div>
        <div className="bg-[var(--background)] rounded-lg border border-[var(--input-border)]">
          <TiptapEditor
            value={formData.content}
            onChange={(newContent) => handleFormChange("content", newContent)}
          />
        </div>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--input-border)]">
          <label
            htmlFor="excerpt"
            className="block text-sm font-bold text-[var(--foreground)] mb-2"
          >
            توضیحات متا (چکیده)
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => handleFormChange("excerpt", e.target.value)}
            rows={4}
            placeholder="یک خلاصه کوتاه برای موتورهای جستجو..."
            className="w-full p-2 bg-[var(--input-background)] border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            این متن در نتایج گوگل نمایش داده می‌شود. بین ۱۵۰ تا ۱۶۰ کاراکتر
            بهینه است.
          </p>
        </div>
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="p-4 bg-[var(--secondary)] rounded-lg border border-[var(--input-border)] sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">انتشار</h2>
            <select
              value={formData.status}
              onChange={(e) => handleFormChange("status", e.target.value)}
              className="p-2 text-sm bg-[var(--input-background)] border border-[var(--input-border)] rounded-md"
            >
              <option value="publish">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="private">خصوصی</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full button-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی"}
          </button>
          {submitStatus.message && (
            <div
              className={`mt-3 p-2 text-xs rounded-md text-center ${
                submitStatus.type === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-300"
                  : submitStatus.type === "error"
                  ? "bg-[var(--error-background)] text-[var(--error)]"
                  : "bg-blue-500/10 text-blue-700"
              }`}
            >
              {submitStatus.message}
            </div>
          )}
        </div>
        <SidebarSection
          title="آدرس URL"
          icon={<Settings size={16} />}
          defaultOpen={true}
        >
          <input
            id="slug"
            type="text"
            value={formData.slug}
            onChange={(e) => handleFormChange("slug", e.target.value)}
            className="w-full p-2 text-left bg-[var(--input-background)] border border-[var(--input-border)] rounded-md"
            dir="ltr"
          />
        </SidebarSection>
        <SidebarSection
          title="دسته‌بندی‌ها"
          icon={<Settings size={16} />}
          defaultOpen={true}
        >
          <TermSelector
            terms={allCategories}
            selectedTerms={formData.selectedCategories}
            onChange={(val) => handleFormChange("selectedCategories", val)}
          />
        </SidebarSection>
        <SidebarSection
          title="برچسب‌ها"
          icon={<Tag size={16} />}
          defaultOpen={true}
        >
          <TermSelector
            terms={allTags}
            selectedTerms={formData.selectedTags}
            onChange={(val) => handleFormChange("selectedTags", val)}
          />
        </SidebarSection>
        <SidebarSection
          title="تصویر شاخص"
          icon={<ImageIcon size={16} />}
          defaultOpen={true}
        >
          <ImageUploader
            title=""
            imageUrl={formData.featuredImage}
            onImageChange={(val) => handleFormChange("featuredImage", val)}
            revalidatePath="/admin/posts"
          />
        </SidebarSection>
      </div>
    </form>
  );
}
