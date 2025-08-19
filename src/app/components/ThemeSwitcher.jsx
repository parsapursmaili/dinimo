// components/ThemeSwitcher.jsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ThemeSwitcher() {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect فقط برای جلوگیری از رندر شدن در سمت سرور استفاده می‌شود
  // تا از hydration mismatch جلوگیری شود.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // برای جلوگیری از پرش UI، یک placeholder با اندازه مشخص رندر می‌کنیم
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-foreground/10 transition-colors"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
