import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx + tailwind-merge.
 * Standard shadcn/ui utility.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
