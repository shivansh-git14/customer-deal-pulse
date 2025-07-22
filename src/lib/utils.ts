import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

export const getTargetTrend = (percentage: number) => {
  if (percentage >= 100) return 'up';
  if (percentage >= 90) return 'neutral';
  return 'down';
};

export const getMomentumBadge = (momentum: string) => {
  const variants = {
    'Accelerating': 'bg-success/10 text-success border-success/20',
    'Improving': 'bg-info/10 text-info border-info/20',
    'Stable': 'bg-muted text-muted-foreground',
    'Declining': 'bg-danger/10 text-danger border-danger/20'
  };
  return variants[momentum as keyof typeof variants] || variants.Stable;
};

export const getRiskBadge = (risk: string) => {
  const variants = {
    'Low Risk': 'bg-success/10 text-success border-success/20',
    'Medium Risk': 'bg-warning/10 text-warning border-warning/20',
    'High Risk': 'bg-danger/10 text-danger border-danger/20'
  };
  return variants[risk as keyof typeof variants] || variants['Low Risk'];
};

export const getPerformanceColor = (score: number) => {
  if (score >= 85) return 'bg-success text-success-foreground';
  if (score >= 70) return 'bg-warning text-warning-foreground';
  return 'bg-danger text-danger-foreground';
};

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
