import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Plus, Send, Clock, XCircle, Target, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useJobSources } from '@/hooks/useJobSources';
import { JobSourceRow } from '@/components/JobSourceRow';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { jobSources, stats, loading: dataLoading, updateJobSource, addJobSource, deleteJobSource, updateWeeklyGoal } = useJobSources();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: '', baseUrl: '', filterQuery: '' });
  const [newGoal, setNewGoal] = useState('');

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

  const handleUpdateGoal = async () => {
    const goalNum = parseInt(newGoal);
    if (isNaN(goalNum) || goalNum < 1) {
      toast.error('Please enter a valid goal number');
      return;
    }
    await updateWeeklyGoal(goalNum);
    setShowGoalDialog(false);
    setNewGoal('');
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
        {/* Colored Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Applications Sent */}
          <div className="bg-success/30 border border-success/40 rounded-2xl p-6 relative">
            <div className="absolute top-6 right-6 p-3 bg-success rounded-full">
              <Send className="h-5 w-5 text-success-foreground" />
            </div>
            <div className="text-sm font-medium text-foreground mb-2">Applications Sent</div>
            <div className="text-4xl font-bold text-foreground">{stats.totalSent}</div>
          </div>

          {/* Waiting Response */}
          <div className="bg-warning/30 border border-warning/40 rounded-2xl p-6 relative">
            <div className="absolute top-6 right-6 p-3 bg-warning rounded-full">
              <Clock className="h-5 w-5 text-warning-foreground" />
            </div>
            <div className="text-sm font-medium text-foreground mb-2">Waiting Response</div>
            <div className="text-4xl font-bold text-foreground">{stats.totalWaiting}</div>
          </div>

          {/* Rejections */}
          <div className="bg-destructive/30 border border-destructive/40 rounded-2xl p-6 relative">
            <div className="absolute top-6 right-6 p-3 bg-destructive rounded-full">
              <XCircle className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div className="text-sm font-medium text-foreground mb-2">Rejections</div>
            <div className="text-4xl font-bold text-foreground">{stats.totalRejected}</div>
          </div>

          {/* Weekly Goal */}
          <div className="bg-muted border border-border rounded-2xl p-6 relative">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-foreground/10"
                onClick={() => {
                  setNewGoal(stats.weeklyGoal.toString());
                  setShowGoalDialog(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <div className="p-3 bg-foreground rounded-full">
                <Target className="h-5 w-5 text-background" />
              </div>
            </div>
            <div className="text-sm font-medium text-foreground mb-2">Weekly Goal</div>
            <div className="text-4xl font-bold text-foreground">{stats.totalSent}</div>
            <div className="text-sm text-muted-foreground mt-1">/ {stats.weeklyGoal} applications</div>
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

      {/* Edit Weekly Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Weekly Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Weekly Goal (applications)</label>
              <Input
                type="number"
                min="1"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoal}>
              Update Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
