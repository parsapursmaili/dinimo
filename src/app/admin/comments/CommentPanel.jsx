"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import {
  ThumbsUp,
  Shield,
  Trash2,
  Edit,
  X,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  fetchComments,
  updateCommentsStatus,
  updateCommentContent,
  deleteCommentsPermanently,
} from "./commentActions";

// کامپوننت داخلی برای نمایش یک دیدگاه
const CommentItem = ({ comment, isSelected, onSelect, level }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isPending, startTransition] = useTransition();

  const handleAction = (action, payload) => {
    startTransition(async () => {
      try {
        if (action === "delete") {
          await deleteCommentsPermanently([comment.id]);
        } else if (action === "status") {
          await updateCommentsStatus([comment.id], payload);
        } else if (action === "edit") {
          await updateCommentContent(comment.id, editedContent);
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Failed to perform action:", error);
      }
    });
  };

  return (
    <div className="relative">
      {/* خط اتصال برای پاسخ‌ها */}
      {level > 0 && (
        <span
          className="absolute -right-4 top-9 h-[calc(100%-2.25rem)] w-px bg-border"
          aria-hidden="true"
        />
      )}
      <div
        className={`
          group flex w-full gap-4 rounded-xl border bg-background p-4 sm:p-5
          transition-all duration-300 ease-in-out
          ${
            isSelected
              ? "border-primary shadow-lg"
              : "border-border shadow-md hover:shadow-lg hover:border-primary/50"
          }
          ${isPending ? "opacity-50 pointer-events-none animate-pulse" : ""}
        `}
      >
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
            checked={isSelected}
            onChange={(e) => onSelect(comment.id, e)}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  {comment.author}
                </span>
                <a
                  href={`mailto:${comment.author_email}`}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {comment.author_email}
                </a>
              </div>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 pt-1">
              {new Date(comment.date).toLocaleString("fa-IR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-input-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("edit")}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all transform hover:scale-105"
                  disabled={isPending}
                >
                  ذخیره
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80"
                >
                  لغو
                </button>
              </div>
            </div>
          ) : (
            <p className="text-foreground/90 leading-relaxed text-base whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          <div className="border-t border-border pt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => handleAction("status", "publish")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors"
              disabled={isPending}
            >
              <ThumbsUp size={16} /> تایید
            </button>
            <button
              onClick={() => handleAction("status", "spam")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-orange-500 transition-colors"
              disabled={isPending}
            >
              <Shield size={16} /> اسپم
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              disabled={isPending || isEditing}
            >
              <Edit size={16} /> ویرایش
            </button>
            <button
              onClick={() => handleAction("delete")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-error transition-colors"
              disabled={isPending}
            >
              <Trash2 size={16} /> حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// کامپوننت اصلی پنل
export default function CommentPanel({ initialComments }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [comments, setComments] = useState(initialComments);
  const [selectedComments, setSelectedComments] = useState([]);
  const [lastCheckedId, setLastCheckedId] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isActionPending, startActionTransition] = useTransition();
  const selectAllCheckboxRef = useRef(null);

  const flatComments = useMemo(() => {
    const flatten = (nodes) =>
      nodes.flatMap((node) => [
        node,
        ...(node.children ? flatten(node.children) : []),
      ]);
    return flatten(comments);
  }, [comments]);

  const flatCommentIds = useMemo(
    () => flatComments.map((c) => c.id),
    [flatComments]
  );

  useEffect(() => {
    const loadComments = async () => {
      setIsFetching(true);
      setSelectedComments([]);
      setLastCheckedId(null);
      try {
        const data = await fetchComments(activeTab);
        setComments(data);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        setComments([]);
      } finally {
        setIsFetching(false);
      }
    };
    if (activeTab !== "pending") {
      loadComments();
    } else {
      setComments(initialComments);
      setSelectedComments([]);
      setLastCheckedId(null);
    }
  }, [activeTab, initialComments]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelected = selectedComments.length;
      const numTotal = flatCommentIds.length;
      selectAllCheckboxRef.current.checked =
        numSelected === numTotal && numTotal > 0;
      selectAllCheckboxRef.current.indeterminate =
        numSelected > 0 && numSelected < numTotal;
    }
  }, [selectedComments, flatCommentIds]);

  const handleSelect = (commentId, event) => {
    if (event.nativeEvent.shiftKey && lastCheckedId) {
      const start = flatCommentIds.indexOf(lastCheckedId);
      const end = flatCommentIds.indexOf(commentId);
      const range = flatCommentIds.slice(
        Math.min(start, end),
        Math.max(start, end) + 1
      );
      const newSelection = new Set([...selectedComments, ...range]);
      setSelectedComments(Array.from(newSelection));
    } else {
      setSelectedComments((prev) =>
        prev.includes(commentId)
          ? prev.filter((id) => id !== commentId)
          : [...prev, commentId]
      );
    }
    setLastCheckedId(commentId);
  };

  const handleSelectAll = (e) =>
    setSelectedComments(e.target.checked ? flatCommentIds : []);

  const handleBulkAction = (action, payload) => {
    startActionTransition(async () => {
      const commentsToUpdate = [...selectedComments];
      setSelectedComments([]);
      setLastCheckedId(null);
      // Optimistic UI update
      setComments((prev) =>
        prev.filter((c) => !commentsToUpdate.includes(c.id))
      );
      try {
        if (action === "delete") {
          await deleteCommentsPermanently(commentsToUpdate);
        } else if (action === "status") {
          await updateCommentsStatus(commentsToUpdate, payload);
        }
      } catch (error) {
        // Revert on error (optional, depends on desired UX)
        console.error("Bulk action failed:", error);
      }
    });
  };

  const commentTree = useMemo(() => {
    const map = new Map();
    const roots = [];
    comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
    comments.forEach((c) => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });
    return roots;
  }, [comments]);

  const RecursiveCommentList = ({ comments, level = 0 }) => (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{ marginRight: level > 0 ? "1.5rem" : "0" }}
        >
          <CommentItem
            comment={comment}
            isSelected={selectedComments.includes(comment.id)}
            onSelect={handleSelect}
            level={level}
          />
          {comment.children?.length > 0 && (
            <div className="mt-6">
              <RecursiveCommentList
                comments={comment.children}
                level={level + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const tabs = {
    pending: "در انتظار",
    publish: "تایید شده",
    spam: "اسپم",
  };

  return (
    <div
      className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
          مدیریت دیدگاه‌ها
        </h1>
        <div className="border-b border-border mb-6">
          <nav
            className="-mb-px flex space-x-reverse space-x-6"
            aria-label="Tabs"
          >
            {Object.entries(tabs).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-base transition-all duration-300
                  ${
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
              >
                {value}
              </button>
            ))}
          </nav>
        </div>

        {selectedComments.length > 0 && (
          <div className="sticky top-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 shadow-lg">
            <span className="font-medium text-foreground">
              {selectedComments.length} دیدگاه انتخاب شده
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleBulkAction("status", "publish")}
                disabled={isActionPending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-transform transform hover:scale-105"
              >
                <ThumbsUp size={16} /> تایید کردن
              </button>
              <button
                onClick={() => handleBulkAction("status", "spam")}
                disabled={isActionPending}
                className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2 transition-transform transform hover:scale-105"
              >
                <Shield size={16} /> انتقال به اسپم
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                disabled={isActionPending}
                className="bg-error text-error-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 disabled:opacity-50 flex items-center gap-2 transition-transform transform hover:scale-105"
              >
                <Trash2 size={16} /> حذف دائمی
              </button>
              <button
                onClick={() => setSelectedComments([])}
                disabled={isActionPending}
                className="bg-muted text-muted-foreground hover:bg-muted/80 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {flatCommentIds.length > 0 && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-background border border-border">
            <input
              ref={selectAllCheckboxRef}
              type="checkbox"
              onChange={handleSelectAll}
              id="selectAll"
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
            />
            <label
              htmlFor="selectAll"
              className="font-medium text-foreground cursor-pointer select-none"
            >
              انتخاب همه
            </label>
          </div>
        )}

        <div className="min-h-[300px]">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
              <Loader2 size={40} className="animate-spin text-primary mb-4" />
              <p className="text-lg">در حال بارگذاری دیدگاه‌ها...</p>
            </div>
          ) : flatCommentIds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-background rounded-lg border-2 border-dashed border-border">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground">
                دیدگاهی یافت نشد
              </h3>
              <p className="mt-1 text-sm">
                در این بخش هنوز دیدگاهی برای نمایش وجود ندارد.
              </p>
            </div>
          ) : (
            <RecursiveCommentList comments={commentTree} />
          )}
        </div>
      </div>
    </div>
  );
}
