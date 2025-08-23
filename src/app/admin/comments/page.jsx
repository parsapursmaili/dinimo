import CommentPanel from "./CommentPanel";
import { fetchComments } from "./commentActions";

export default async function AdminCommentsPage() {
  // دریافت دیدگاه‌های در انتظار به عنوان داده‌های اولیه در سرور
  const initialComments = await fetchComments("pending");

  return (
    <div className="w-full">
      <CommentPanel initialComments={initialComments} />
    </div>
  );
}
