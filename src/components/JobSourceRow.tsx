import { useState } from 'react';
import { JobSource } from '@/hooks/useJobSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ExternalLink, Plus, Minus, Clock, Edit2, Check, X, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface JobSourceRowProps {
  source: JobSource;
  onUpdate: (source: JobSource) => void;
  onDelete: (id: string, name: string) => void;
}

export const JobSourceRow = ({ source, onUpdate, onDelete }: JobSourceRowProps) => {
  const [isEditingFilter, setIsEditingFilter] = useState(false);
  const [editedFilter, setEditedFilter] = useState(source.filterQuery);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedPlatform, setEditedPlatform] = useState({
    name: source.name,
    baseUrl: source.baseUrl,
    filterQuery: source.filterQuery
  });

  const handleOpenEditDialog = () => {
    setEditedPlatform({
      name: source.name,
      baseUrl: source.baseUrl,
      filterQuery: source.filterQuery
    });
    setShowEditDialog(true);
  };

  const handleOpen = () => {
    let url = source.baseUrl;
    // Add protocol if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    // Add filter query
    url = url + source.filterQuery;
    window.open(url, '_blank');
    toast.success(`Opened ${source.name}`);
  };

  const handleIncrement = (field: 'sentCount' | 'rejectedCount' | 'waitingCount') => {
    onUpdate({ ...source, [field]: source[field] + 1 });
  };

  const handleDecrement = (field: 'sentCount' | 'rejectedCount' | 'waitingCount') => {
    if (source[field] > 0) {
      onUpdate({ ...source, [field]: source[field] - 1 });
    }
  };

  const handleNotesChange = (notes: string) => {
    onUpdate({ ...source, notes });
  };

  const handleSaveFilter = () => {
    onUpdate({ ...source, filterQuery: editedFilter });
    setIsEditingFilter(false);
    toast.success('Filter updated');
  };

  const handleSaveEdit = () => {
    onUpdate({ 
      ...source, 
      name: editedPlatform.name,
      baseUrl: editedPlatform.baseUrl,
      filterQuery: editedPlatform.filterQuery 
    });
    setShowEditDialog(false);
    toast.success('Platform updated');
  };

  const handleReset = () => {
    if (confirm(`Reset all counters for ${source.name}?`)) {
      onUpdate({ 
        ...source, 
        sentCount: 0,
        waitingCount: 0,
        rejectedCount: 0
      });
      toast.success('Counters reset');
    }
  };

  return (
    <>
      <div className="bg-card border border-border p-4 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Platform Name */}
          <div className="lg:w-32">
            <h3 className="font-semibold">{source.name}</h3>
          </div>

          {/* Filter Query */}
          <div className="flex-1 flex items-center gap-2">
            {isEditingFilter ? (
              <>
                <Input
                  value={editedFilter}
                  onChange={(e) => setEditedFilter(e.target.value)}
                  className="flex-1"
                  placeholder="Filter query..."
                />
                <Button size="icon" variant="ghost" onClick={handleSaveFilter}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingFilter(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {source.filterQuery || 'No filter'}
                </span>
                <Button size="icon" variant="ghost" onClick={handleOpenEditDialog}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Open Button */}
          <Button size="sm" onClick={handleOpen} className="gap-1">
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </Button>

          {/* Counters */}
          <div className="flex items-center gap-3">
            {/* Sent */}
            <div className="flex items-center gap-1 px-3 py-2 bg-success rounded-lg">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-success-foreground/10 text-success-foreground"
                onClick={() => handleDecrement('sentCount')}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-base font-bold text-success-foreground min-w-[2rem] text-center">
                {source.sentCount}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-success-foreground/10 text-success-foreground"
                onClick={() => handleIncrement('sentCount')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Waiting */}
            <div className="flex items-center gap-1 px-3 py-2 bg-warning rounded-lg">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-warning-foreground/10 text-warning-foreground"
                onClick={() => handleDecrement('waitingCount')}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-base font-bold text-warning-foreground min-w-[2rem] text-center flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {source.waitingCount}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-warning-foreground/10 text-warning-foreground"
                onClick={() => handleIncrement('waitingCount')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Rejected */}
            <div className="flex items-center gap-1 px-3 py-2 bg-destructive rounded-lg">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-destructive-foreground/10 text-destructive-foreground"
                onClick={() => handleDecrement('rejectedCount')}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-base font-bold text-destructive-foreground min-w-[2rem] text-center">
                {source.rejectedCount}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-destructive-foreground/10 text-destructive-foreground"
                onClick={() => handleIncrement('rejectedCount')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="lg:w-48">
            <Textarea
              value={source.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Notes..."
              className="min-h-[2.5rem] text-sm"
            />
          </div>

          {/* Reset Button */}
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Delete Button */}
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Are you sure you want to remove ${source.name}?`)) {
                onDelete(source.id, source.name);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Platform Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <Input
                value={editedPlatform.name}
                onChange={(e) => setEditedPlatform({ ...editedPlatform, name: e.target.value })}
                placeholder="e.g. LinkedIn"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base URL</label>
              <Input
                value={editedPlatform.baseUrl}
                onChange={(e) => setEditedPlatform({ ...editedPlatform, baseUrl: e.target.value })}
                placeholder="e.g. https://www.linkedin.com/jobs/search/?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Query (Optional)</label>
              <Input
                value={editedPlatform.filterQuery}
                onChange={(e) => setEditedPlatform({ ...editedPlatform, filterQuery: e.target.value })}
                placeholder="e.g. f_E=1&geoId=102257491"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
