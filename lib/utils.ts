import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function scrollToBottom(ref: React.RefObject<HTMLDivElement | null>) {
  if (ref.current) {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  }
}

export function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) {
    return 'bg-green-100 text-green-800';
  } else if (similarity >= 0.6) {
    return 'bg-yellow-100 text-yellow-800';
  } else if (similarity >= 0.4) {
    return 'bg-orange-100 text-orange-800';
  } else {
    return 'bg-red-100 text-red-800';
  }
}

export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) {
    return 'Very High Match';
  } else if (similarity >= 0.6) {
    return 'High Match';
  } else if (similarity >= 0.4) {
    return 'Moderate Match';
  } else {
    return 'Low Match';
  }
}
