"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const storageKey = "endfield-theme";

const themeOptions = [
  {
    key: "midnight-signal",
    label: "Midnight Signal",
    preview: ["#74171c", "#d73f43", "#09080a"],
  },
  {
    key: "aurora-mint",
    label: "Aurora Mint",
    preview: ["#8b2028", "#ec737e", "#12090b"],
  },
  {
    key: "solar-ember",
    label: "Solar Ember",
    preview: ["#8f2d1b", "#ef6b4c", "#160c0a"],
  },
  {
    key: "glacier-wave",
    label: "Glacier Wave",
    preview: ["#60202a", "#dd666d", "#0f090b"],
  },
  {
    key: "crimson-circuit",
    label: "Crimson Circuit",
    preview: ["#8c1e24", "#f05a5c", "#11080a"],
  },
] as const;

type ThemeKey = (typeof themeOptions)[number]["key"];

const themeKeys = new Set<ThemeKey>(themeOptions.map((theme) => theme.key));
const defaultTheme: ThemeKey = "crimson-circuit";

function applyTheme(themeKey: ThemeKey) {
  document.documentElement.dataset.theme = themeKey;
}

function readStoredTheme() {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  return themeKeys.has(storedTheme as ThemeKey)
    ? (storedTheme as ThemeKey)
    : defaultTheme;
}

function subscribeToThemeChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorageChange(event: StorageEvent) {
    if (event.key === storageKey) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("endfield-theme-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("endfield-theme-change", onStoreChange);
  };
}

export function ThemeSwitcher() {
  const activeTheme = useSyncExternalStore(
    subscribeToThemeChange,
    readStoredTheme,
    () => defaultTheme,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const activeThemePreview = themeOptions.find(
    (theme) => theme.key === activeTheme,
  )?.preview ?? ["#8c1e24", "#f05a5c", "#11080a"];

  const isOpen = isHovered || isPinned;

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  function handleThemeChange(themeKey: ThemeKey) {
    applyTheme(themeKey);
    window.localStorage.setItem(storageKey, themeKey);
    window.dispatchEvent(new Event("endfield-theme-change"));
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 md:bottom-5 md:right-5">
      <div
        className="pointer-events-auto flex w-12 flex-col items-center gap-2 md:w-14"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <div className="flex w-full flex-col items-center gap-2">
          {themeOptions.map((theme, index) => {
            const isActive = theme.key === activeTheme;

            return (
              <button
                key={theme.key}
                type="button"
                aria-label={theme.label}
                title={theme.label}
                onClick={() => handleThemeChange(theme.key)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-white/12 shadow-[0_14px_36px_rgba(0,0,0,0.32)] transition-all duration-300 md:h-11 md:w-11",
                  isOpen
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-4 opacity-0",
                  isActive
                    ? "ring-2 ring-white/65 ring-offset-2 ring-offset-[#090b10]"
                    : "scale-95 hover:scale-100 hover:border-white/22",
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 35}ms` : "0ms",
                  background: `linear-gradient(135deg, ${theme.preview[0]} 0%, ${theme.preview[1]} 55%, ${theme.preview[2]} 100%)`,
                }}
              >
                <span className="sr-only">{theme.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Open theme colors"
          aria-expanded={isOpen}
          onClick={() => setIsPinned((currentValue) => !currentValue)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 text-white shadow-[0_18px_48px_rgba(0,0,0,0.34)] transition-all hover:-translate-y-0.5 hover:border-white/18 md:h-14 md:w-14"
          style={{
            background: `linear-gradient(135deg, ${activeThemePreview[0]} 0%, ${activeThemePreview[1]} 100%)`,
          }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-black/20 backdrop-blur-xl md:h-11 md:w-11">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a9 9 0 1 0 9 9 2.5 2.5 0 0 1-2.5 2.5H17a2 2 0 0 0-2 2c0 1.93-1.57 3.5-3.5 3.5A9 9 0 0 1 12 3Z" />
              <circle cx="7.5" cy="10.5" r=".9" fill="currentColor" stroke="none" />
              <circle cx="12" cy="7.5" r=".9" fill="currentColor" stroke="none" />
              <circle cx="16.5" cy="10.5" r=".9" fill="currentColor" stroke="none" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
