import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export const StatsCard = ({ title, value, icon: Icon, variant = 'default' }: StatsCardProps) => {
  const variantStyles = {
    default: 'card-stats',
    success: 'card-success',
    warning: 'card-warning',
    destructive: 'card-destructive',
  };

  const iconContainerStyles = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  const iconTextStyles = {
    default: 'text-primary-foreground',
    success: 'text-success-foreground',
    warning: 'text-warning-foreground',
    destructive: 'text-destructive-foreground',
  };

  return (
    <Card className={`${variantStyles[variant]} border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tracking-tight">{title}</CardTitle>
        <div className={`p-2.5 rounded-2xl shadow-sm ${iconContainerStyles[variant]}`}>
          <Icon className={`h-4 w-4 ${iconTextStyles[variant]}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
};
