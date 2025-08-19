"use client";

import parse, { domToReact } from "html-react-parser";
import Image from "next/image";
import myImageLoader from "./image-loader";

export default function ArticleRenderer({ content }) {
  const options = {
    replace: (domNode) => {
      if (domNode.name === "img" && domNode.attribs) {
        // ۱. خواندن width و height از اتریبیوت‌های تگ img
        const { src, alt, width, height } = domNode.attribs;

        if (src) {
          return (
            <Image
              loader={myImageLoader}
              src={src}
              alt={alt || "تصویر داخل محتوا"}
              // ۲. استفاده از مقادیر ذخیره شده، با یک مقدار پیش‌فرض
              width={width ? parseInt(width, 10) : 800}
              height={height ? parseInt(height, 10) : 600}
              sizes="(max-width: 768px) 100vw, 800px"
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px",
                margin: "2rem 0",
              }}
              className="content-image"
            />
          );
        }
      }
      return domToReact(domNode.children, options);
    },
  };

  return (
    <div className="prose dark:prose-invert max-w-none">
      {parse(content, options)}
    </div>
  );
}
