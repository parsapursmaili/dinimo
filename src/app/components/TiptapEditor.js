"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
// ۱. ایمپورت کردن اکستنشن سفارشی به جای اکستنشن پیش‌فرض Tiptap/Image
import CustomImageExtension from "./CustomImageExtension";
import { useCallback, useState } from "react";
import "@/app/css/Tiptap.css"; // مسیر CSS را بر اساس پروژه خود تنظیم کنید
import MediaLibraryModal from "./MediaLibraryModal";
import ImageAttributesModal from "./ImageAttributesModal";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Quote,
  Pilcrow,
  Image as ImageIcon,
} from "lucide-react";

// کامپوننت دکمه برای نوار ابزار (کامل و بدون تغییر)
const ToolbarButton = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={isActive ? "is-active" : ""}
    title={title}
  >
    {children}
  </button>
);

// نوار ابزار (کامل)
const Toolbar = ({ editor }) => {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false);
  const [selectedImagePath, setSelectedImagePath] = useState(null);

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("آدرس لینک:", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleSelectImageFromLibrary = (imagePath) => {
    setIsMediaLibraryOpen(false);
    setSelectedImagePath(imagePath);
    setIsAttributesModalOpen(true);
  };

  const handleSetImageAttributes = ({ alt, width, height }) => {
    if (selectedImagePath) {
      editor
        .chain()
        .focus()
        .setImage({
          src: selectedImagePath,
          alt,
          width: width ? parseInt(width, 10) : undefined,
          height: height ? parseInt(height, 10) : undefined,
        })
        .run();
    }
    setIsAttributesModalOpen(false);
    setSelectedImagePath(null);
  };

  const generateDefaultAlt = () => {
    if (!selectedImagePath) return "";
    const fileName = selectedImagePath
      .split("/")
      .pop()
      .split(".")
      .slice(0, -1)
      .join(".");
    return fileName.replace(/[-_]/g, " ");
  };

  return (
    <>
      <div className="tiptap-toolbar flex items-center flex-wrap gap-1 p-2">
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title="تیتر ۱"
        >
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="تیتر ۲"
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title="تیتر ۳"
        >
          <Heading3 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
          title="پاراگراف"
        >
          <Pilcrow size={18} />
        </ToolbarButton>
        <div className="divider"></div>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="بولد"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="ایتالیک"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          title="لینک"
        >
          <LinkIcon size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="نقل قول"
        >
          <Quote size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setIsMediaLibraryOpen(true)}
          isActive={false}
          title="افزودن تصویر"
        >
          <ImageIcon size={18} />
        </ToolbarButton>

        <div className="divider"></div>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="راست‌چین"
        >
          <AlignRight size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="وسط‌چین"
        >
          <AlignCenter size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="چپ‌چین"
        >
          <AlignLeft size={18} />
        </ToolbarButton>
        <div className="divider"></div>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="لیست نقطه‌ای"
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="لیست عددی"
        >
          <ListOrdered size={18} />
        </ToolbarButton>
      </div>

      {isMediaLibraryOpen && (
        <MediaLibraryModal
          onClose={() => setIsMediaLibraryOpen(false)}
          onSelectImage={handleSelectImageFromLibrary}
          revalidatePath="/admin/posts"
        />
      )}
      <ImageAttributesModal
        isOpen={isAttributesModalOpen}
        onClose={() => setIsAttributesModalOpen(false)}
        onSubmit={handleSetImageAttributes}
        defaultAlt={generateDefaultAlt()}
      />
    </>
  );
};

// کامپوننت اصلی ویرایشگر (کامل و نهایی)
export default function TiptapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),

      // ۲. استفاده از اکستنشن سفارشی خودمان برای رندر کردن تصاویر با کامپوننت React
      CustomImageExtension.configure({
        inline: false,
        HTMLAttributes: {
          // این کلاس اکنون به تگ wrapper (NodeViewWrapper) اضافه می‌شود، نه خود img
          class: "content-image-in-editor",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "tiptap-editor-field",
      },
    },
    immediatelyRender: false,
  });

  return (
    <>
      {/* ۳. اضافه کردن استایل گلوبال برای نمایش انتخاب شدن تصویر در ویرایشگر */}
      <style jsx global>{`
        .content-image-wrapper[data-selected="true"] {
          outline: 3px solid var(--primary);
          border-radius: 10px;
        }
      `}</style>
      <div className="tiptap-container">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
