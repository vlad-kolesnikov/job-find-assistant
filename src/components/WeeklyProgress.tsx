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
    <Card className="card-stats border-border transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
        <div className={`p-2 rounded-lg ${isComplete ? 'bg-success' : 'bg-primary'}`}>
          <Target className={`h-4 w-4 ${isComplete ? 'text-success-foreground' : 'text-primary-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold">{current}</span>
          <span className="text-sm text-muted-foreground">/ {goal} applications</span>
        </div>
        <Progress value={percentage} className="h-2" />
        {isComplete && (
          <p className="text-sm text-success font-medium">🎉 Goal achieved!</p>
        )}
      </CardContent>
    </Card>
  );
};
