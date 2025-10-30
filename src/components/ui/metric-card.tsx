import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
  trend?: "up" | "down" | "flat";
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
  trend
}: MetricCardProps) {
  return (
    <Card className={cn("glass hover:shadow-elevated transition-all", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        {change && (
          <p className={cn(
            "text-xs flex items-center mt-1",
            changeType === "positive" && "text-chart-success",
            changeType === "negative" && "text-chart-error",
            changeType === "neutral" && "text-muted-foreground"
          )}>
            {trend === "up" && "↗"}
            {trend === "down" && "↘"}
            {trend === "flat" && "→"}
            <span className="ml-1">{change}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}