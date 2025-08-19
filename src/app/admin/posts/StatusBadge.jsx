// app/PostManagement/StatusBadge.jsx

export default function StatusBadge({ status }) {
  const statusStyles = {
    publish:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    draft:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    private: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const statusText = {
    publish: "منتشر شده",
    draft: "پیش‌نویس",
    private: "خصوصی",
  };

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
        statusStyles[status] || ""
      }`}
    >
      {statusText[status] || status}
    </span>
  );
}
