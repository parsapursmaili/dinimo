"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { SearchIcon } from "./Icons";

export default function FilterComponent({ categories, tags, postCount }) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleFilterChange = useDebouncedCallback((key, value) => {
    // [CLIENT FILTER LOG] - این لاگ بسیار مهم است
    console.log(
      `[FILTER LOG] handleFilterChange called. Key: "${key}", Value: "${value}"`
    );

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");

    const newUrl = `${pathname}?${params.toString()}`;
    console.log(`[FILTER LOG] Navigating to: ${newUrl}`);

    replace(newUrl);
  }, 300);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={`جستجو در ${postCount} پست...`}
            defaultValue={searchParams.get("search")?.toString() || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full p-2.5 pr-10 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          onChange={(e) => handleFilterChange("status", e.target.value)}
          defaultValue={searchParams.get("status")?.toString() || ""}
          className="p-2.5 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="publish">منتشر شده</option>
          <option value="draft">پیش‌نویس</option>
          <option value="private">خصوصی</option>
        </select>

        {/* Category Filter */}
        <select
          onChange={(e) => handleFilterChange("category", e.target.value)}
          defaultValue={searchParams.get("category")?.toString() || ""}
          className="p-2.5 rounded-lg bg-[var(--input-background)] border border-[var(--input-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
