"use client";

import { useTheme, Theme } from "@/app/contexts/ThemeContext";
import { useState } from "react";

const themes: { name: Theme; label: string; colors: string[] }[] = [
  {
    name: "sunset",
    label: "Sunset",
    colors: ["rgb(255, 107, 107)", "rgb(254, 202, 87)", "rgb(255, 159, 67)"],
  },
  {
    name: "ocean",
    label: "Ocean",
    colors: ["rgb(52, 152, 219)", "rgb(46, 204, 113)", "rgb(155, 89, 182)"],
  },
  {
    name: "forest",
    label: "Forest",
    colors: ["rgb(39, 174, 96)", "rgb(142, 68, 173)", "rgb(241, 196, 15)"],
  },
  {
    name: "lavender",
    label: "Lavender",
    colors: ["rgb(155, 89, 182)", "rgb(230, 126, 210)", "rgb(142, 68, 173)"],
  },
  {
    name: "fire",
    label: "Fire",
    colors: ["rgb(231, 76, 60)", "rgb(241, 196, 15)", "rgb(230, 126, 34)"],
  },
  {
    name: "candy",
    label: "Candy",
    colors: ["rgb(255, 107, 193)", "rgb(130, 204, 221)", "rgb(255, 193, 107)"],
  },
  {
    name: "midnight",
    label: "Midnight",
    colors: ["rgb(52, 152, 219)", "rgb(155, 89, 182)", "rgb(26, 188, 156)"],
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative block w-[70px] h-[70px] rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50"
        // style={{
        //   focusRingColor: `rgb(var(--theme-primary))`,
        // }}
        aria-label="Select theme"
      >
        <img
          className="block w-full h-full object-contain relative"
          src="/stunts_logo_letter_transparent.png"
          alt="Logo"
        />
        <div
          className="flex justify-center align-center p-4 absolute inset-0 rounded-lg opacity-0 group-hover:opacity-80 transition-opacity duration-300 z-2"
          style={{
            background: `linear-gradient(135deg, rgb(var(--theme-primary)), rgb(var(--theme-secondary)))`,
          }}
        >
          <span className="text-white text-sm text-center">Change Theme</span>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute left-0 top-[80px] z-50 w-72 rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
            style={{
              backgroundColor: `rgb(var(--theme-bg-secondary))`,
            }}
          >
            <div
              className="px-4 py-2 font-semibold text-md"
              style={{
                background: `rgb(var(--theme-primary))`,
                color: "white",
              }}
            >
              Choose Theme
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setTheme(t.name);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                    theme === t.name
                      ? "ring-2 ring-offset-2 shadow-md"
                      : "hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor:
                      theme === t.name
                        ? `rgba(var(--theme-primary), 0.1)`
                        : `rgba(var(--theme-bg-primary), 0.5)`,
                    // ringColor:
                    //   theme === t.name ? `rgb(var(--theme-primary))` : "",
                  }}
                >
                  <div className="flex gap-1">
                    {t.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span
                    className="flex-1 text-left font-medium"
                    style={{ color: `rgb(var(--theme-text-primary))` }}
                  >
                    {t.label}
                  </span>
                  {theme === t.name && (
                    <svg
                      className="w-5 h-5"
                      style={{ color: `rgb(var(--theme-primary))` }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
