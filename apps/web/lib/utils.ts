import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | undefined | null, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}
