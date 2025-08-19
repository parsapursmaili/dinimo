import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditorImageComponent from "./EditorImageComponent";

// ما اکستنشن پیش‌فرض Image را می‌گیریم و آن را با Node View خودمان گسترش می‌دهیم
const CustomImageExtension = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EditorImageComponent);
  },
});

export default CustomImageExtension;
