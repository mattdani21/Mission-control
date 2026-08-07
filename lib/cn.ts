import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names with Tailwind conflict resolution.
 * Standard shadcn/ui helper — the frozen v1 stack (GOAL.md, LAUNCH_CHECKLIST.md §1).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
