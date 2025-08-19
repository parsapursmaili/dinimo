"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "خانه", href: "/" },
    { name: "بازی‌ها", href: "/games" },
    { name: "پنل ادمین", href: "/admin" },
    { name: "فروشگاه", href: "/store" },
    { name: "انجمن", href: "/community" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-secondary/95 backdrop-blur-lg shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(0,204,255,0.3)]">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* لوگو (دینیمو) در سمت راست */}
        <Link href="/" className="flex items-center gap-2">
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-primary bg-clip-text bg-gradient-to-l from-primary to-accent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            دینیمو
          </motion.h1>
        </Link>

        {/* منوی ناوبری (در وسط برای دسکتاپ) */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative text-foreground font-medium px-3 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-accent group"
            >
              {item.name}
              <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* دکمه تغییر تم و منوی موبایل (در سمت چپ) */}
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <button
            className="md:hidden text-foreground hover:text-primary transition-colors duration-200"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* منوی موبایل (تمام‌صفحه و مدرن) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              className="fixed top-0 right-0 bottom-0 left-0 bg-background/95 backdrop-blur-xl md:hidden z-40"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="flex flex-col h-full pt-20 px-6">
                <ul className="flex flex-col items-end gap-6 text-right">
                  {navItems.map((item, index) => (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="w-full"
                    >
                      <Link
                        href={item.href}
                        className="block text-foreground text-xl font-semibold py-3 px-4 rounded-lg hover:bg-primary/20 hover:text-accent transition-all duration-300 relative overflow-hidden group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                        <span className="absolute top-0 right-0 w-1 h-full bg-accent/50 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
