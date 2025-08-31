"use client";

import { useState, useEffect, useRef } from "react";
import { incrementViewCount } from "./action";
import { CalendarDays, Eye } from "lucide-react";

export default function PostStats({ initialViews, postId, postDate }) {
  const [currentViews, setCurrentViews] = useState(initialViews);
  const hasIncremented = useRef(false);
  useEffect(() => {
    if (!hasIncremented.current) {
      incrementViewCount(postId);

      setCurrentViews((prevViews) => prevViews + 1);

      hasIncremented.current = true;
    }
  }, [postId]); // این افکت فقط یک بار پس از mount شدن اجرا می‌شود

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-4 text-foreground/80">
      <div className="flex items-center gap-2 hover:text-primary transition-colors">
        <CalendarDays className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">{postDate}</span>
      </div>
      <div className="flex items-center gap-2 hover:text-accent transition-colors">
        <Eye className="w-5 h-5 text-accent" />
        <span className="font-medium text-sm">
          {/* 4. عددی را نمایش می‌دهیم که در state کلاینت ذخیره شده است */}
          {currentViews.toLocaleString("fa-IR")} بازدید
        </span>
      </div>
    </div>
  );
}
