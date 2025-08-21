"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import myImageLoader from "@/app/components/image-loader";
import { getMediaLibrary, deleteImage } from "@/app/actions/mediaActions";

export default function MediaLibraryModal({
  onClose,
  onSelectImage,
  revalidatePath,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const media = await getMediaLibrary();
        // اطمینان از اینکه همیشه یک آرایه داریم
        setImages(Array.isArray(media) ? media : []);
      } catch (error) {
        console.error("Failed to fetch media:", error);
        alert("خطا در بارگذاری رسانه‌ها.");
        setImages([]); // در صورت خطا، یک آرایه خالی تنظیم شود
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 200);
  };

  const handleDelete = async (e, imagePathToDelete) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `آیا از حذف فایل "${imagePathToDelete.split("/").pop()}" مطمئن هستید؟`
      )
    ) {
      return;
    }
    const result = await deleteImage(imagePathToDelete, revalidatePath);
    if (result.success) {
      setImages((prev) => prev.filter((img) => img !== imagePathToDelete));
    } else {
      alert(result.message);
    }
  };

  // ۱. منطق فیلتر کردن که حذف شده بود، به طور کامل بازگردانده شد
  const filteredImages = useMemo(() => {
    if (!Array.isArray(images)) {
      return [];
    }
    return images.filter((img) =>
      img.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [images, searchTerm]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-[var(--background)] rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col border border-[var(--input-border)] transition-all duration-200 ease-out ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--input-border)] flex justify-between items-center">
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            کتابخانه رسانه
          </h3>
          <button
            onClick={handleClose}
            className="text-3xl text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-4 border-b border-[var(--input-border)]">
          <input
            type="text"
            placeholder="جستجو..."
            className="w-full p-2 bg-[var(--secondary)] border border-[var(--input-border)] rounded-md focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none text-[var(--foreground)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="p-4 flex-grow overflow-y-auto">
          {loading ? (
            <p className="text-center text-[var(--foreground-muted)]">
              در حال بارگذاری...
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {filteredImages.map((path) => (
                <div
                  key={path}
                  className="group relative cursor-pointer aspect-square"
                  onClick={() => onSelectImage(path)}
                >
                  <button
                    onClick={(e) => handleDelete(e, path)}
                    className="absolute top-1 right-1 z-10 w-6 h-6 bg-black/50 text-white text-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--error)]"
                    title="حذف"
                  >
                    ×
                  </button>
                  <Image
                    loader={myImageLoader}
                    src={`${path}?size=m`}
                    alt={path.split("/").pop() || ""}
                    fill
                    sizes="(max-width: 640px) 25vw, 12vw"
                    style={{ objectFit: "cover" }}
                    className="rounded-md border-2 border-[var(--input-border)] group-hover:border-[var(--primary)] transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
