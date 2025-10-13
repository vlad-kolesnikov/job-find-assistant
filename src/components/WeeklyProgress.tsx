import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface WeeklyProgressProps {
  current: number;
  goal: number;
}

export const WeeklyProgress = ({ current, goal }: WeeklyProgressProps) => {
  const percentage = Math.min((current / goal) * 100, 100);
  const isComplete = current >= goal;

  return (
    <Card className="glass transition-all duration-300 hover:border-primary/30 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tracking-tight">Weekly Goal</CardTitle>
        <div className={`p-2 rounded-lg ${isComplete ? 'gradient-success' : 'gradient-primary'}`}>
          <Target className="h-4 w-4 text-background" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold tracking-tight">{current}</span>
          <span className="text-sm text-muted-foreground font-light">/ {goal} applications</span>
        </div>
        <Progress value={percentage} className="h-2" />
        {isComplete && (
          <p className="text-sm text-success font-medium">🎉 Goal achieved!</p>
        )}
      </CardContent>
    </Card>
  );
};
