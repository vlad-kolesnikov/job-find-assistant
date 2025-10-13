import { useState, useEffect } from 'react';
import { JobSource, ApplicationStats } from '@/types/job';
import { storage } from '@/lib/storage';
import { StatsCard } from '@/components/StatsCard';
import { JobSourceRow } from '@/components/JobSourceRow';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { Button } from '@/components/ui/button';
import { Send, Clock, XCircle, Briefcase, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [jobSources, setJobSources] = useState<JobSource[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);

  useEffect(() => {
    const sources = storage.getJobSources();
    const appStats = storage.getAppStats();
    setJobSources(sources);
    setStats(appStats);
  }, []);

  useEffect(() => {
    if (jobSources.length > 0) {
      const totalSent = jobSources.reduce((sum, source) => sum + source.sentCount, 0);
      const totalWaiting = jobSources.reduce((sum, source) => sum + source.waitingCount, 0);
      const totalRejected = jobSources.reduce((sum, source) => sum + source.rejectedCount, 0);

      const newStats: ApplicationStats = {
        totalSent,
        totalWaiting,
        totalRejected,
        weeklyGoal: stats?.weeklyGoal || 10,
        lastUpdated: new Date(),
      };

      setStats(newStats);
      storage.setAppStats(newStats);
    }
  }, [jobSources]);

  const handleSourceUpdate = (updatedSource: JobSource) => {
    const newSources = jobSources.map((source) =>
      source.id === updatedSource.id ? updatedSource : source
    );
    setJobSources(newSources);
    storage.setJobSources(newSources);
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Platform', 'Filter Query', 'Sent', 'Waiting', 'Rejected', 'Notes'];
    const csvRows = jobSources.map((source) => [
      source.name,
      source.filterQuery,
      source.sentCount,
      source.waitingCount,
      source.rejectedCount,
      source.notes,
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exported successfully');
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-2xl shadow-sm">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Job Find Assistant</h1>
                <p className="text-sm text-muted-foreground font-normal">Track your job applications efficiently</p>
              </div>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="rounded-full border-border/50 hover:bg-accent transition-all shadow-sm">
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <StatsCard
            title="Applications Sent"
            value={stats.totalSent}
            icon={Send}
            variant="success"
          />
          <StatsCard
            title="Waiting Response"
            value={stats.totalWaiting}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Rejections"
            value={stats.totalRejected}
            icon={XCircle}
            variant="destructive"
          />
          <WeeklyProgress current={stats.totalSent} goal={stats.weeklyGoal} />
        </section>

        {/* Job Boards Table */}
        <section className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Job Boards</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Manage your applications across different platforms
              </p>
            </div>
            <Button variant="outline" className="gap-2 rounded-full border-border/50 hover:bg-accent transition-all shadow-sm">
              <Plus className="h-4 w-4" />
              Add Platform
            </Button>
          </div>

          <div className="space-y-3">
            {jobSources.map((source, index) => (
              <div key={source.id} className="animate-fade-in" style={{ animationDelay: `${0.15 + index * 0.05}s` }}>
                <JobSourceRow source={source} onUpdate={handleSourceUpdate} />
              </div>
            ))}
          </div>
        </section>

        {/* Legend */}
        <section className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border/50 pt-6 font-normal">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success shadow-sm" />
            <span>Sent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning shadow-sm" />
            <span>Waiting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive shadow-sm" />
            <span>Rejected</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
