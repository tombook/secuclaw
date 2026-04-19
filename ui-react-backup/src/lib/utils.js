import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Merge Tailwind CSS classes with clsx + tailwind-merge.
 * Standard shadcn/ui utility.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=utils.js.map