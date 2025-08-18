// components/manual-theme-switcher.jsx
"use client";

import { useState, useEffect } from "react";

// می‌توانید از آیکون‌های خودتان استفاده کنید
const SunIcon = () => "☀️";
const MoonIcon = () => "🌙";

export function ManualThemeSwitcher() {
  const [theme, setTheme] = useState("light");

  // مرحله ۱: در اولین رندر سمت کلاینت، تم ذخیره شده را بخوان
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    // همچنین تم سیستم کاربر را هم بررسی می‌کنیم
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    }
  }, []);

  // مرحله ۲: هر بار که وضعیت 'theme' تغییر می‌کند، کلاس را به HTML و localStorage اعمال کن
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // برای جلوگیری از رندر دکمه در سمت سرور (که باعث عدم تطابق می‌شود)
  // می‌توانیم تا زمانی که کامپوننت mount نشده، چیزی رندر نکنیم
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-2xl rounded-md transition-colors duration-200"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
