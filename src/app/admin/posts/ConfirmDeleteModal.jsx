// app/PostManagement/ConfirmDeleteModal.jsx

export default function ConfirmDeleteModal({
  post,
  onClose,
  onConfirm,
  isPending,
}) {
  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">تایید حذف</h2>
        <p>
          آیا از حذف پست "{post.title}" مطمئن هستید؟ این عمل غیرقابل بازگشت است.
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
            {isPending ? "در حال حذف..." : "حذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
