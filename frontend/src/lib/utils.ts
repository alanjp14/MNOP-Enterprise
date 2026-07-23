import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan class CSS dengan aman menggunakan clsx dan tailwind-merge.
 * Berguna untuk pembuatan komponen dengan class dinamis.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Memformat ukuran byte menjadi format yang mudah dibaca manusia (KB, MB, GB, dst).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Memformat durasi dalam detik menjadi format "Xd Xh Xm".
 */
export function formatUptime(seconds: number): string {
  if (seconds < 0) return '0m';
  
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);

  return parts.join(' ');
}

/**
 * Memformat nilai desimal menjadi persentase.
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Memformat latensi dengan satuan yang sesuai (ms).
 */
export function formatLatency(ms: number): string {
  if (ms < 1) return '< 1 ms';
  return `${Math.round(ms)} ms`;
}
