"use client";

import { useState, useEffect } from "react";

export default function ImageAttributesModal({
  isOpen,
  onClose,
  onSubmit,
  defaultAlt,
}) {
  const [alt, setAlt] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAlt(defaultAlt || "");
      setWidth("800");
      setHeight("600");
    }
  }, [isOpen, defaultAlt]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // این تابع اکنون از طریق onClick دکمه "تایید" فراخوانی می‌شود
  const handleSubmit = () => {
    onSubmit({ alt, width, height });
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-[var(--background)] rounded-lg shadow-xl w-full max-w-md flex flex-col border border-[var(--input-border)] transition-all duration-200 ease-out ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--input-border)] flex justify-between items-center">
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            تنظیمات تصویر
          </h3>
          <button
            onClick={handleClose}
            className="text-3xl text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
          >
            ×
          </button>
        </div>

        {/* ۱. تگ form را به div تغییر می‌دهیم تا هیچ رفتار submit پیش‌فرضی نداشته باشد */}
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="altText"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              متن جایگزین (alt)
            </label>
            <input
              id="altText"
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full p-2 bg-[var(--input-background)] border border-[var(--input-border)] rounded-md"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="imgWidth"
                className="block text-sm font-medium text-[var(--foreground)] mb-1"
              >
                عرض (Width)
              </label>
              <input
                id="imgWidth"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full p-2 bg-[var(--input-background)] border border-[var(--input-border)] rounded-md"
                placeholder="مثال: 800"
              />
            </div>
            <div>
              <label
                htmlFor="imgHeight"
                className="block text-sm font-medium text-[var(--foreground)] mb-1"
              >
                ارتفاع (Height)
              </label>
              <input
                id="imgHeight"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-2 bg-[var(--input-background)] border border-[var(--input-border)] rounded-md"
                placeholder="مثال: 600"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-[var(--secondary)] hover:brightness-95 text-[var(--foreground)]"
            >
              لغو
            </button>

            {/* ۲. نوع دکمه "تایید" به "button" تغییر کرده و از onClick استفاده می‌کند */}
            <button
              type="button"
              onClick={handleSubmit}
              className="button-primary px-4 py-2 text-sm"
            >
              تایید و درج تصویر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
