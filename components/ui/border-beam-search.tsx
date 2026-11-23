"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Search, X } from "lucide-react";
import { BorderBeam } from "border-beam";
import type {
  BorderBeamColorVariant,
  BorderBeamProps,
  BorderBeamSize,
  BorderBeamTheme,
} from "border-beam";

export type {
  BorderBeamProps,
  BorderBeamSize,
  BorderBeamTheme,
  BorderBeamColorVariant,
};

export { BorderBeam };
export default BorderBeam;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getServerReducedMotionSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    getServerReducedMotionSnapshot,
  );
}

function getDocumentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToDocumentTheme(callback: () => void) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function useDocumentTheme() {
  return useSyncExternalStore(
    subscribeToDocumentTheme,
    getDocumentTheme,
    () => "dark" as const,
  );
}

export interface BorderBeamSearchProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  rightSlot?: ReactNode;
  className?: string;
  inputClassName?: string;
  size?: BorderBeamSize;
  colorVariant?: BorderBeamColorVariant;
  theme?: BorderBeamTheme;
  duration?: number;
  borderRadius?: number;
  strength?: number;
  glowSize?: number;
  active?: boolean;
}

export function BorderBeamSearch({
  id,
  label,
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  rightSlot,
  className = "",
  inputClassName = "",
  size = "line",
  colorVariant = "ocean",
  theme = "auto",
  duration = 3.1,
  borderRadius = 16,
  strength = 0.85,
  glowSize = 0.9,
  active = true,
}: BorderBeamSearchProps) {
  const reducedMotion = usePrefersReducedMotion();
  const docTheme = useDocumentTheme();
  const resolvedTheme: "dark" | "light" = theme === "auto" ? docTheme : theme;
  const isLight = resolvedTheme === "light";

  return (
    <BorderBeam
      size={size}
      colorVariant={colorVariant}
      theme={resolvedTheme}
      duration={duration}
      borderRadius={borderRadius}
      strength={strength}
      glowSize={glowSize}
      active={active && !reducedMotion}
      className={`w-full ${className}`.trim()}
    >
      <div
        className={`relative flex w-full items-center gap-2 rounded-2xl border p-1.5 backdrop-blur-xl transition-colors duration-150 ease-unslop ${
          isLight
            ? "border-slate-900/[0.12] bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.06)] focus-within:border-sky-600/60"
            : "border-[#eef0f5]/[0.12] bg-[#11141c]/90 shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] focus-within:border-[#38bdf8]/60"
        }`}
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <Search
          className={`ml-2.5 h-4 w-4 shrink-0 sm:ml-3 ${
            isLight ? "text-slate-500" : "text-[#7a8296]"
          }`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent py-2 text-[13px] focus:outline-none sm:text-sm ${
            isLight
              ? "text-slate-900 placeholder-slate-500"
              : "text-[#eef0f5] placeholder-[#7a8296]"
          } ${inputClassName}`.trim()}
        />
        {value.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search query"
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
              isLight
                ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                : "text-[#7a8296] hover:bg-[#1a1e28] hover:text-[#eef0f5]"
            }`}
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
        {rightSlot}
      </div>
    </BorderBeam>
  );
}
