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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Job Find Assistant</h1>
                <p className="text-sm text-muted-foreground">Track your job applications</p>
              </div>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="rounded-lg border-border hover:bg-muted transition-all">
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Stats Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
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
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Job Boards</h2>
              <p className="text-sm text-muted-foreground">
                Manage your applications across platforms
              </p>
            </div>
            <Button variant="outline" className="gap-2 rounded-lg border-border hover:bg-muted transition-all">
              <Plus className="h-4 w-4" />
              Add Platform
            </Button>
          </div>

          <div className="space-y-2">
            {jobSources.map((source, index) => (
              <div key={source.id} className="animate-fade-in" style={{ animationDelay: `${0.15 + index * 0.05}s` }}>
                <JobSourceRow source={source} onUpdate={handleSourceUpdate} />
              </div>
            ))}
          </div>
        </section>

        {/* Legend */}
        <section className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span>Sent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span>Waiting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span>Rejected</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
