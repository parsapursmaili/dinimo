"use client";

import parse from "html-react-parser";
import Image from "next/image";
import myImageLoader from "@/app/components/image-loader";

export default function ArticleRenderer({ content }) {
  const options = {
    replace: (domNode) => {
      if (domNode.name === "img" && domNode.attribs && domNode.attribs.src) {
        const { src, alt, width, height } = domNode.attribs;
        return (
          // یک استایل جذاب‌تر برای تصاویر داخل محتوا
          <div className="relative my-8 overflow-hidden rounded-xl shadow-lg border border-white/10">
            <Image
              loader={myImageLoader}
              src={src}
              alt={alt || "تصویر داخل محتوا"}
              width={width ? parseInt(width, 10) : 800}
              height={height ? parseInt(height, 10) : 450}
              sizes="(max-width: 768px) 100vw, 800px"
              className="w-full h-auto transition-transform duration-500 hover:scale-105"
            />
          </div>
        );
      }
    },
  };

  // استایل‌های prose برای خوانایی بهتر در پس‌زمینه نیمه‌شفاف
  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none text-foreground/90
                   prose-p:leading-relaxed prose-headings:text-foreground prose-h2:text-2xl 
                   prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-10 prose-h2:pb-3 prose-h2:border-b prose-h2:border-primary/30
                   prose-a:text-primary hover:prose-a:text-accent prose-strong:text-foreground
                   prose-blockquote:border-r-4 prose-blockquote:border-accent prose-blockquote:pr-4 prose-blockquote:italic
                   prose-code:bg-background/50 prose-code:rounded-md prose-code:p-1"
    >
      {parse(content, options)}
    </div>
  );
}
