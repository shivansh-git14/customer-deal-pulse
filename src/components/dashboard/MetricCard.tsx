import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
}

export const MetricCard = ({ title, value, subtitle, trend, icon, className = '', onClick, isClickable = false }: MetricCardProps) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(1)}K`;
      } else if (val % 1 !== 0) {
        return val.toFixed(2);
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card 
      className={`w-full transition-all duration-300 shadow-sm hover:shadow-md ${
        isClickable 
          ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' 
          : ''
      } ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-3xl font-bold text-foreground mb-2">{formatValue(value)}</div>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
        {isClickable && (
          <p className="text-xs text-primary mt-3 font-medium opacity-75 hover:opacity-100 transition-opacity">
            Click to view details →
          </p>
        )}
      </CardContent>
    </Card>
  );
};