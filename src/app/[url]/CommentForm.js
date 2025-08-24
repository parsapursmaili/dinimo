"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { User, Mail, MessageSquare, Send } from "lucide-react";
import { addComment } from "./action";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 bg-primary text-background font-bold rounded-full shadow-[0_0_12px_rgba(0,255,255,0.4)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transform hover:-translate-y-0.5 flex items-center gap-2 disabled:bg-primary/50 disabled:cursor-not-allowed disabled:transform-none text-sm"
    >
      {pending ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></span>
          <span>در حال ارسال...</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          <span>ارسال دیدگاه</span>
        </>
      )}
    </button>
  );
}

export default function CommentForm({
  postId,
  parentId = 0,
  postUrl,
  onCommentSubmitted,
  replyingTo,
}) {
  const initialState = { success: null, message: "" };
  const [state, formAction] = useActionState(addComment, initialState);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success === true) {
      formRef.current?.reset();
      if (onCommentSubmitted) onCommentSubmitted();
    }
  }, [state, onCommentSubmitted]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5 bg-secondary/30 backdrop-blur-sm border border-secondary/40 p-5 md:p-6 rounded-xl shadow-lg transition-all duration-300"
    >
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="postUrl" value={postUrl} />

      {parentId > 0 && (
        <p className="text-sm text-accent font-semibold mb-1">
          در حال پاسخ به{" "}
          <span className="font-bold text-primary">{replyingTo}</span>...
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 pointer-events-none" />
          <input
            type="text"
            name="author"
            placeholder="نام شما (اجباری)"
            required
            className="w-full bg-background/80 border-2 border-secondary/80 rounded-lg py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 pointer-events-none" />
          <input
            type="email"
            name="author_email"
            placeholder="ایمیل (اختیاری)"
            className="w-full bg-background/80 border-2 border-secondary/80 rounded-lg py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="relative">
        <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-foreground/50 pointer-events-none" />
        <textarea
          name="content"
          placeholder="دیدگاه خود را بنویسید..."
          required
          rows={4}
          className="w-full bg-background/80 border-2 border-secondary/80 rounded-lg py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y"
        ></textarea>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2">
        <div className="h-4 text-sm">
          {state.message && (
            <p className={state.success ? "text-green-400" : "text-error"}>
              {state.message}
            </p>
          )}
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
