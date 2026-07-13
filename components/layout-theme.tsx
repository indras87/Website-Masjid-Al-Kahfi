"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings } from "lucide-react";

const themes = [
  { id: "zamrud", name: "Zamrud Klasik", col: "bg-[#059669]" },
  { id: "syafii", name: "Syafii Blue", col: "bg-[#2563eb]" },
  { id: "kasturi", name: "Kasturi Maroon", col: "bg-[#881337]" },
  { id: "zaitun", name: "Zaitun Sage", col: "bg-[#5f7a68]" },
  { id: "raudhah", name: "Ar-Raudhah", col: "bg-[#0d9488]" },
];

/** Tombol melayang untuk membuka pemilih tema warna situs. */
export function ThemeSettings() {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [theme, setTheme] = useState("zamrud");

  useEffect(() => {
    const savedTheme = localStorage.getItem("kahfi-theme") || "zamrud";
    setTheme(savedTheme);
    document.documentElement.classList.remove(
      "theme-zamrud",
      "theme-syafii",
      "theme-kasturi",
      "theme-zaitun",
      "theme-raudhah",
    );
    document.documentElement.classList.add(`theme-${savedTheme}`);
  }, []);

  /** Mengganti tema aktif, menyimpan pilihan ke localStorage, dan memperbarui kelas pada root. */
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("kahfi-theme", newTheme);
    document.documentElement.classList.remove(
      "theme-zamrud",
      "theme-syafii",
      "theme-kasturi",
      "theme-zaitun",
      "theme-raudhah",
    );
    document.documentElement.classList.add(`theme-${newTheme}`);
    setIsThemeMenuOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isThemeMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gold-200 p-4 w-60 space-y-3"
          >
            <h4 className="font-serif font-bold text-emerald-950 text-sm border-b pb-2">
              🎨 Sesuaikan Tema Web
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  className={`text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${theme === t.id ? "bg-gold-50 border border-gold-300" : "hover:bg-gray-50 border border-transparent"}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full ${t.col} border border-gray-200`}
                  ></span>
                  <span className="text-gray-800">{t.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
        className="w-12 h-12 bg-emerald-900 text-gold-300 hover:text-emerald-950 hover:bg-gold-500 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:rotate-90"
      >
        <Settings size={20} />
      </button>
    </div>
  );
}
