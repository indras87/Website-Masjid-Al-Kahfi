import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Menggabungkan nama kelas Tailwind sembari meresolve konflik (twMerge + clsx). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
