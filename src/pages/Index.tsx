import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useJobSources } from '@/hooks/useJobSources';
import { JobSourceRow } from '@/components/JobSourceRow';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { jobSources, stats, loading: dataLoading, updateJobSource, addJobSource, deleteJobSource } = useJobSources();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: '', baseUrl: '', filterQuery: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  const handleAddPlatform = async () => {
    if (!newPlatform.name || !newPlatform.baseUrl) {
      toast.error('Please fill in platform name and URL');
      return;
    }
    await addJobSource(newPlatform.name, newPlatform.baseUrl, newPlatform.filterQuery);
    setShowAddDialog(false);
    setNewPlatform({ name: '', baseUrl: '', filterQuery: '' });
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

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Job Application Tracker</h1>
            <div className="flex items-center gap-3">
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                Export CSV
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Compact Stats */}
        <section className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Applications Sent</div>
              <div className="text-2xl font-bold text-success">{stats.totalSent}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Waiting Response</div>
              <div className="text-2xl font-bold text-warning">{stats.totalWaiting}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Rejections</div>
              <div className="text-2xl font-bold text-destructive">{stats.totalRejected}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Weekly Goal</div>
              <div className="text-2xl font-bold">{stats.totalSent} / {stats.weeklyGoal}</div>
            </div>
          </div>
        </section>

        {/* Job Boards Table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Job Boards</h2>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>

          <div className="space-y-2">
            {jobSources.map((source) => (
              <JobSourceRow 
                key={source.id} 
                source={source} 
                onUpdate={updateJobSource}
                onDelete={deleteJobSource}
              />
            ))}
            {jobSources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                No job sources yet. Default platforms will appear after first login.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Platform Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <Input
                placeholder="e.g. LinkedIn"
                value={newPlatform.name}
                onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base URL</label>
              <Input
                placeholder="e.g. https://www.linkedin.com/jobs/search/?"
                value={newPlatform.baseUrl}
                onChange={(e) => setNewPlatform({ ...newPlatform, baseUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Query (Optional)</label>
              <Input
                placeholder="e.g. f_E=1&geoId=102257491"
                value={newPlatform.filterQuery}
                onChange={(e) => setNewPlatform({ ...newPlatform, filterQuery: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlatform}>
              Add Platform
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
