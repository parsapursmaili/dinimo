"use client";

import { useState } from "react";
import { Reply } from "lucide-react"; // آیکون از lucide-react جایگزین شد
import CommentForm from "./CommentForm";

// کامپوننت تکی برای نمایش یک دیدگاه
function Comment({ comment, postInfo, parentAuthorName }) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const commentDate = new Date(comment.date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="group flex gap-4 animate-[fade-in_0.5s_ease-out]">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-2">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/50 to-accent/50 rounded-full flex items-center justify-center text-background font-bold text-xl shadow-md ring-2 ring-primary/30 transition-transform duration-300 group-hover:scale-110">
          {comment.author.charAt(0)}
        </div>
      </div>

      <div className="flex-1">
        {/* Comment Card */}
        <div className="bg-secondary/40 border border-primary/20 rounded-xl rounded-tr-none transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-[0_0_20px_var(--primary-rgb,0_255_255_/_0.2)]">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-3 border-b border-primary/20 bg-gradient-to-l from-secondary/40 to-primary/10 rounded-t-xl">
            <div>
              {parentAuthorName && (
                <div className="flex items-center gap-2 text-xs mb-1 text-accent">
                  <Reply className="w-3 h-3 scale-x-[-1]" />{" "}
                  {/* آیکون جایگزین شد */}
                  <span>
                    در پاسخ به{" "}
                    <strong className="font-bold">{parentAuthorName}</strong>
                  </span>
                </div>
              )}
              <span className="font-extrabold text-lg text-primary">
                {comment.author}
              </span>
            </div>
            <span className="text-xs  text-foreground/60 self-end sm:self-center">
              {commentDate}
            </span>
          </div>
          {/* Card Body */}
          <div className="p-4">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-6 mt-3 px-2">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-accent transition-all transform hover:scale-105 hover:drop-shadow-[0_0_8px_var(--accent)]"
          >
            <Reply className="w-4 h-4" /> {/* آیکون جایگزین شد */}
            <span>{showReplyForm ? "بستن فرم پاسخ" : "پاسخ دادن"}</span>
          </button>
        </div>

        {/* Reply Form (Conditional) */}
        {showReplyForm && (
          <div className="mt-6 transition-all duration-500">
            <CommentForm
              postId={postInfo.postId}
              parentId={comment.id}
              postUrl={postInfo.postUrl}
              replyingTo={comment.author}
              onCommentSubmitted={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-6 pl-8 border-r-2 border-dashed border-accent/50 space-y-6">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                postInfo={postInfo}
                parentAuthorName={comment.author}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// کامپوننت اصلی برای نمایش لیست دیدگاه‌ها
export default function CommentsList({ comments, postInfo }) {
  if (!comments || comments.length === 0) {
    return null;
  }
  return (
    <div className="space-y-8">
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} postInfo={postInfo} />
      ))}
    </div>
  );
}
