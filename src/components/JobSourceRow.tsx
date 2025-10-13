import { useState } from 'react';
import { JobSource } from '@/hooks/useJobSources';
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
              <Button size="icon" variant="ghost" onClick={() => setIsEditingFilter(true)}>
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
          <div className="flex items-center gap-1 px-2 py-1 bg-success/20 rounded">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleDecrement('sentCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-semibold text-success min-w-[2rem] text-center">
              {source.sentCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleIncrement('sentCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Waiting */}
          <div className="flex items-center gap-1 px-2 py-1 bg-warning/20 rounded">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleDecrement('waitingCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-semibold text-warning min-w-[2rem] text-center flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {source.waitingCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleIncrement('waitingCount')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Rejected */}
          <div className="flex items-center gap-1 px-2 py-1 bg-destructive/20 rounded">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleDecrement('rejectedCount')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-semibold text-destructive min-w-[2rem] text-center">
              {source.rejectedCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleIncrement('rejectedCount')}
            >
              <Plus className="h-3 w-3" />
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
      </div>
    </div>
  );
};
