import { useState } from 'react';
import { JobSource } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Minus, Clock, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface JobSourceRowProps {
  source: JobSource;
  onUpdate: (source: JobSource) => void;
}

export const JobSourceRow = ({ source, onUpdate }: JobSourceRowProps) => {
  const [isEditingFilter, setIsEditingFilter] = useState(false);
  const [editedFilter, setEditedFilter] = useState(source.filterQuery);

  const handleOpen = () => {
    const url = `${source.baseUrl}${source.filterQuery}`;
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

  return (
    <div className="glass grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 rounded-xl hover:border-primary/30 transition-all duration-300 group">
      {/* Platform Name */}
      <div className="lg:col-span-2 flex items-center">
        <h3 className="font-semibold text-lg tracking-tight">{source.name}</h3>
      </div>

      {/* Filter Query */}
      <div className="lg:col-span-3 flex items-center gap-2">
        {isEditingFilter ? (
          <>
            <Input
              value={editedFilter}
              onChange={(e) => setEditedFilter(e.target.value)}
              className="flex-1 glass border-border/50"
              placeholder="Filter query..."
            />
            <Button size="icon" variant="ghost" onClick={handleSaveFilter} className="hover:bg-primary/10">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingFilter(false)} className="hover:bg-destructive/10">
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground truncate flex-1 font-light">
              {source.filterQuery || 'No filter set'}
            </span>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingFilter(true)} className="hover:bg-primary/10">
              <Edit2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="lg:col-span-4 flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={handleOpen} className="gap-1 glass border-primary/20 hover:bg-primary/20 transition-all">
          <ExternalLink className="h-4 w-4" />
          Open
        </Button>

        {/* Sent */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground text-center font-light">Applications Sent</span>
          <div className="flex items-center gap-1 glass rounded-lg px-2 py-1 border-success/20">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-success/20"
              onClick={() => handleDecrement('sentCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="success" className="min-w-[2rem] justify-center gradient-success font-medium">
              {source.sentCount}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-success/20"
              onClick={() => handleIncrement('sentCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Waiting */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground text-center font-light">Waiting Response</span>
          <div className="flex items-center gap-1 glass rounded-lg px-2 py-1 border-warning/20">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-warning/20"
              onClick={() => handleDecrement('waitingCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="warning" className="min-w-[2rem] justify-center gradient-warning font-medium">
              <Clock className="h-3 w-3 mr-1" />
              {source.waitingCount}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-warning/20"
              onClick={() => handleIncrement('waitingCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Rejected */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground text-center font-light">Rejections</span>
          <div className="flex items-center gap-1 glass rounded-lg px-2 py-1 border-destructive/20">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/20"
              onClick={() => handleDecrement('rejectedCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="destructive" className="min-w-[2rem] justify-center gradient-destructive font-medium">
              {source.rejectedCount}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/20"
              onClick={() => handleIncrement('rejectedCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="lg:col-span-3">
        <Textarea
          value={source.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add notes..."
          className="min-h-[2.5rem] resize-none glass border-border/50 font-light"
        />
      </div>
    </div>
  );
};
