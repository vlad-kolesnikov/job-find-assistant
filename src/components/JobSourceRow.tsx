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
    <div className="bg-card border border-border/50 grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
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
              className="flex-1 border-border/50 rounded-xl"
              placeholder="Filter query..."
            />
            <Button size="icon" variant="ghost" onClick={handleSaveFilter} className="hover:bg-success/10 rounded-xl">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingFilter(false)} className="hover:bg-destructive/10 rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground truncate flex-1 font-normal">
              {source.filterQuery || 'No filter set'}
            </span>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingFilter(true)} className="hover:bg-primary/10 rounded-xl">
              <Edit2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="lg:col-span-4 flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={handleOpen} className="gap-1 bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all">
          <ExternalLink className="h-4 w-4" />
          Open
        </Button>

        {/* Sent */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground text-center font-normal">Applications Sent</span>
          <div className="flex items-center gap-1 card-success border border-success/20 rounded-xl px-2 py-1 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-success/20 rounded-lg"
              onClick={() => handleDecrement('sentCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="success" className="min-w-[2rem] justify-center font-semibold shadow-sm">
              {source.sentCount}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-success/20 rounded-lg"
              onClick={() => handleIncrement('sentCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Waiting */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground text-center font-normal">Waiting Response</span>
          <div className="flex items-center gap-1 card-warning border border-warning/20 rounded-xl px-2 py-1 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-warning/20 rounded-lg"
              onClick={() => handleDecrement('waitingCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="warning" className="min-w-[2rem] justify-center font-semibold shadow-sm">
              <Clock className="h-3 w-3 mr-1" />
              {source.waitingCount}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-warning/20 rounded-lg"
              onClick={() => handleIncrement('waitingCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Rejected */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground text-center font-normal">Rejections</span>
          <div className="flex items-center gap-1 card-destructive border border-destructive/20 rounded-xl px-2 py-1 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/20 rounded-lg"
              onClick={() => handleDecrement('rejectedCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="destructive" className="min-w-[2rem] justify-center font-semibold shadow-sm">
              {source.rejectedCount}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/20 rounded-lg"
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
          className="min-h-[2.5rem] resize-none border-border/50 rounded-xl font-normal"
        />
      </div>
    </div>
  );
};
