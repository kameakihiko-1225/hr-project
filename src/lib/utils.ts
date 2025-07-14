import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random color in hex format
 * @returns A random color in hex format (e.g., #3b82f6)
 */
export function generateRandomColor(): string {
  const colors = [
    "#b69b83", // beige
    "#16a34a", // green
    "#dc2626", // red
    "#ea580c", // orange
    "#8b5cf6", // purple
    "#0891b2", // cyan
    "#db2777", // pink
    "#65a30d", // lime
    "#854d0e", // amber
    "#6b7280", // gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate initials from a name
 * @param name The full name to generate initials from
 * @returns The initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}
