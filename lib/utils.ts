import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string for display
 * Returns relative time (Yesterday, X days ago, etc.) or formatted date
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Returns CSS classes for similarity score colors
 */
export function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) {
    return 'bg-green-100 text-green-800';
  } else if (similarity >= 0.6) {
    return 'bg-blue-100 text-blue-800';
  } else if (similarity >= 0.4) {
    return 'bg-yellow-100 text-yellow-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Returns human-readable similarity labels
 */
export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) {
    return 'Excellent Match';
  } else if (similarity >= 0.6) {
    return 'Good Match';
  } else if (similarity >= 0.4) {
    return 'Possible Match';
  } else {
    return 'Low Match';
  }
}

/**
 * Utility for smooth scrolling to chat bottom
 */
export function scrollToBottom(ref: React.RefObject<HTMLElement | HTMLDivElement | null>): void {
  ref.current?.scrollIntoView({ behavior: 'smooth' });
}
