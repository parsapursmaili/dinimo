// app/PostManagement/TermPills.jsx

export default function TermPills({ categories, tags }) {
  const categoryList = categories ? categories.split(",") : [];
  const tagList = tags ? tags.split(",") : [];

  return (
    <div className="flex flex-wrap gap-1">
      {categoryList.map((cat, index) => (
        <span
          key={`cat-${index}`}
          className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--primary)] text-white"
        >
          {cat}
        </span>
      ))}
      {tagList.map((tag, index) => (
        <span
          key={`tag-${index}`}
          className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--accent)] text-black"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
