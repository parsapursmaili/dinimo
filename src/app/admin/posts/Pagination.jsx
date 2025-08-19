// app/PostManagement/Pagination.jsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ totalItems }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const totalPages = Math.ceil(totalItems / limit);

  const createPageURL = (pageNumber) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (newPage) => {
    replace(createPageURL(newPage));
  };

  return (
    <div className="flex justify-center items-center mt-6">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 mx-1 rounded-md bg-[var(--secondary)] disabled:opacity-50"
      >
        قبلی
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i + 1}
          onClick={() => handlePageChange(i + 1)}
          className={`px-4 py-2 mx-1 rounded-md ${
            currentPage === i + 1
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--secondary)]"
          }`}
        >
          {i + 1}
        </button>
      ))}

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
