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
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-[hsl(var(--destructive))]" />;
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
      className={`transition-all duration-200 border-0 shadow-sm bg-card/50 backdrop-blur-sm ${isClickable ? 'cursor-pointer hover:shadow-md hover:bg-card/80' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {getTrendIcon()}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold text-foreground mb-1">{formatValue(value)}</div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
        {isClickable && (
          <p className="text-xs text-primary mt-2 font-medium">
            Click to view details
          </p>
        )}
      </CardContent>
    </Card>
  );
};