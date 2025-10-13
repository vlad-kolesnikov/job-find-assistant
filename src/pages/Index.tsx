import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Plus, Send, Clock, XCircle, Target, Edit2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useJobSources } from '@/hooks/useJobSources';
import { JobSourceRow } from '@/components/JobSourceRow';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { jobSources, stats, loading: dataLoading, updateJobSource, addJobSource, deleteJobSource, updateWeeklyGoal, updateMonthlyGoal, reorderJobSources } = useJobSources();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showMonthlyGoalDialog, setShowMonthlyGoalDialog] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: '', baseUrl: '', filterQuery: '' });
  const [newGoal, setNewGoal] = useState('');
  const [newMonthlyGoal, setNewMonthlyGoal] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleUpdateMonthlyGoal = async () => {
    const goalNum = parseInt(newMonthlyGoal);
    if (isNaN(goalNum) || goalNum < 1) {
      toast.error('Please enter a valid goal number');
      return;
    }
    await updateMonthlyGoal(goalNum);
    setShowMonthlyGoalDialog(false);
    setNewMonthlyGoal('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderJobSources(active.id as string, over.id as string);
    }
  };

  const displayName = user?.user_metadata?.full_name 
    || user?.user_metadata?.name 
    || (user?.email ? user.email.split('@')[0] : '');

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
              {displayName && (
                <div className="text-sm text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{displayName}</span>
                </div>
              )}
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
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Monthly Goal */}
          <div className="bg-primary/20 border border-primary/30 rounded-2xl p-6 relative">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={() => {
                  setNewMonthlyGoal(stats.monthlyGoal.toString());
                  setShowMonthlyGoalDialog(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <div className="p-3 bg-primary rounded-full">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="text-sm font-medium text-foreground mb-2">Monthly Goal</div>
            <div className="text-4xl font-bold text-foreground">{stats.totalSent}</div>
            <div className="text-sm text-muted-foreground mt-1">/ {stats.monthlyGoal} applications</div>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={jobSources.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {jobSources.map((source) => (
                  <JobSourceRow 
                    key={source.id} 
                    source={source} 
                    onUpdate={updateJobSource}
                    onDelete={deleteJobSource}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {jobSources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                No job platforms yet.
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

      {/* Edit Monthly Goal Dialog */}
      <Dialog open={showMonthlyGoalDialog} onOpenChange={setShowMonthlyGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Monthly Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Goal (applications)</label>
              <Input
                type="number"
                min="1"
                value={newMonthlyGoal}
                onChange={(e) => setNewMonthlyGoal(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMonthlyGoalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMonthlyGoal}>
              Update Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
