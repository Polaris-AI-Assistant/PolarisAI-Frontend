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

export function getDynamicGreeting(userName?: string): string {
  const now = new Date();
  const hours = now.getHours();
  const dayOfWeek = now.getDay();
  
  let timeGreeting = '';
  
  // Time-based greeting
  if (hours >= 5 && hours < 12) {
    timeGreeting = 'Good morning';
  } else if (hours >= 12 && hours < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hours >= 17 && hours < 21) {
    timeGreeting = 'Good evening';
  } else {
    timeGreeting = 'Good night';
  }
  
  // Special greeting for weekends
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
  
  if (dayOfWeek === 0) { // Sunday
    timeGreeting = `Happy ${dayName}`;
  } else if (dayOfWeek === 6) { // Saturday
    timeGreeting = `Happy ${dayName}`;
  } else if (hours >= 8 && hours < 10) { // Morning rush hour
    timeGreeting = 'Get ready to work';
  }
  
  // Add username if available
  const displayName = userName ? ` ${userName}` : '';
  
  return timeGreeting + displayName + ',';
}
