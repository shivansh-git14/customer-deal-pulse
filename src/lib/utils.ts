import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getCompletionTrend(percentage: number): 'up' | 'down' | 'neutral' {
  if (percentage >= 1) return 'up';
  if (percentage >= 0.75) return 'neutral';
  return 'down';
}

export function getPerformanceTrend(percentage?: number): 'up' | 'down' | 'neutral' {
  if (percentage === undefined || percentage === null) return 'neutral';
  if (percentage >= 1.2) return 'up';
  if (percentage >= 0.9) return 'neutral';
  return 'down';
}
