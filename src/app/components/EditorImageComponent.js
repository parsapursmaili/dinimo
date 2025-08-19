"use client";

import React from "react";
import Image from "next/image";
import myImageLoader from "./image-loader"; // لودر سفارشی شما
import { NodeViewWrapper } from "@tiptap/react";

export default function EditorImageComponent({ node, selected }) {
  const { src, alt, width, height } = node.attrs;

  return (
    // NodeViewWrapper یک کامپوننت کمکی از Tiptap است که برای مدیریت Node View ضروری است
    <NodeViewWrapper
      className="content-image-wrapper"
      data-selected={selected} // این به ما کمک می‌کند تا به تصویر انتخاب شده استایل بدهیم
    >
      <Image
        loader={myImageLoader}
        src={src}
        alt={alt || ""}
        width={width ? parseInt(width, 10) : 800}
        height={height ? parseInt(height, 10) : 600}
        sizes="(max-width: 768px) 100vw, 800px"
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "8px",
        }}
        // این ویژگی‌ها برای تجربه کاربری بهتر در ویرایشگر مهم هستند
        draggable="true"
        contentEditable={false}
      />
    </NodeViewWrapper>
  );
}
