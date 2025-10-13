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
    default: 'glass',
    success: 'glass border-success/20',
    warning: 'glass border-warning/20',
    destructive: 'glass border-destructive/20',
  };

  const iconContainerStyles = {
    default: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warning',
    destructive: 'gradient-destructive',
  };

  return (
    <Card className={`${variantStyles[variant]} transition-all duration-300 hover:border-primary/30 group`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tracking-tight">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconContainerStyles[variant]}`}>
          <Icon className="h-4 w-4 text-background" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
};
