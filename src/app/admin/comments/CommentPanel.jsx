"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { ThumbsUp, Shield, Trash2, Edit, X } from "lucide-react";
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
        if (action === "delete") await deleteCommentsPermanently([comment.id]);
        else if (action === "status")
          await updateCommentsStatus([comment.id], payload);
        else if (action === "edit") {
          await updateCommentContent(comment.id, editedContent);
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Failed to perform action:", error);
      }
    });
  };

  return (
    <div
      className={`
        flex rounded-xl border bg-card p-6 transition-all w-full
        ${isSelected ? "border-primary bg-primary/5" : "border-border"}
        ${isPending ? "opacity-50 pointer-events-none animate-pulse" : ""}
      `}
    >
      <div className="flex-shrink-0 w-8 flex justify-end">
        <input
          type="checkbox"
          className="h-6 w-6 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
          checked={isSelected}
          onChange={(e) => onSelect(comment.id, e)}
        />
      </div>
      <div
        className="flex-1 space-y-3 pr-4"
        style={{ marginRight: `${level * 1.5}rem` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {comment.author_name}
            </span>
            <a
              href={`mailto:${comment.author_email}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {comment.author_email}
            </a>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleString("fa-IR", {
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
              className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("edit")}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
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
          <p className="text-foreground/90 leading-relaxed">
            {comment.content}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            onClick={() => handleAction("status", "approved")}
            className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors"
            disabled={isPending}
          >
            <ThumbsUp size={16} /> تایید
          </button>
          <button
            onClick={() => handleAction("status", "spam")}
            className="flex items-center gap-1 text-muted-foreground hover:text-orange-500 transition-colors"
            disabled={isPending}
          >
            <Shield size={16} /> اسپم
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors"
            disabled={isPending || isEditing}
          >
            <Edit size={16} /> ویرایش
          </button>
          <button
            onClick={() => handleAction("delete")}
            className="flex items-center gap-1 text-muted-foreground hover:text-error transition-colors"
            disabled={isPending}
          >
            <Trash2 size={16} /> حذف
          </button>
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
      const data = await fetchComments(activeTab);
      setComments(data);
      setIsFetching(false);
    };
    if (activeTab !== "pending") loadComments();
    else {
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
      setSelectedComments((prev) => [...new Set([...prev, ...range])]);
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

      if (action === "delete") {
        await deleteCommentsPermanently(commentsToUpdate);
        setComments((prev) =>
          prev.filter((c) => !commentsToUpdate.includes(c.id))
        );
      } else if (action === "status") {
        await updateCommentsStatus(commentsToUpdate, payload);
        setComments((prev) =>
          prev.filter((c) => !commentsToUpdate.includes(c.id))
        );
      }
    });
  };

  const commentTree = useMemo(() => {
    const map = new Map();
    const roots = [];
    comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
    comments.forEach((c) => {
      if (c.parent_id && map.has(c.parent_id))
        map.get(c.parent_id).children.push(map.get(c.id));
      else roots.push(map.get(c.id));
    });
    return roots;
  }, [comments]);

  const RecursiveCommentList = ({ comments, level = 0 }) => (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            isSelected={selectedComments.includes(comment.id)}
            onSelect={handleSelect}
            level={level}
          />
          {comment.children?.length > 0 && (
            <div className="mr-6">
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
          مدیریت دیدگاه‌ها
        </h1>
        <div className="flex border-b border-border mb-6">
          {["pending", "approved", "spam"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {
                {
                  pending: "در انتظار",
                  approved: "تایید شده",
                  spam: "اسپم و حذف شده",
                }[tab]
              }
            </button>
          ))}
        </div>
        {selectedComments.length > 0 && (
          <div className="sticky top-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-background border border-primary/20 shadow-md">
            <span className="font-medium text-foreground">
              {selectedComments.length} دیدگاه انتخاب شده
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleBulkAction("status", "approved")}
                disabled={isActionPending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <ThumbsUp size={16} /> تایید
              </button>
              <button
                onClick={() => handleBulkAction("status", "spam")}
                disabled={isActionPending}
                className="bg-accent text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Shield size={16} /> اسپم
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                disabled={isActionPending}
                className="bg-error text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> حذف دائمی
              </button>
              <button
                onClick={() => setSelectedComments([])}
                disabled={isActionPending}
                className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 mb-6">
          <input
            ref={selectAllCheckboxRef}
            type="checkbox"
            onChange={handleSelectAll}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
          />
          <label
            className="font-medium text-foreground cursor-pointer"
            onClick={() => selectAllCheckboxRef.current?.click()}
          >
            انتخاب همه
          </label>
        </div>
        <div>
          {isFetching ? (
            <p className="text-center py-8 text-muted-foreground animate-pulse">
              در حال بارگذاری...
            </p>
          ) : flatCommentIds.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              دیدگاهی برای نمایش وجود ندارد.
            </p>
          ) : (
            <RecursiveCommentList comments={commentTree} />
          )}
        </div>
      </div>
    </div>
  );
}
