import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Status = 'upcoming' | 'past' | 'canceled';
type InterviewEvent = {
  id: string;
  companyName: string;
  link?: string;
  description?: string;
  time: string; // ISO datetime
  status: Status;
};

const STORAGE_KEY = 'calendar:events';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const statusColor: Record<Status, string> = {
  upcoming: '#3b82f6', // blue-500
  past: '#6b7280', // gray-500
  canceled: '#ef4444', // red-500
};

const CalendarPage = () => {
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InterviewEvent | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<Status>('upcoming');

  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as InterviewEvent[];
        setEvents(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch = !search || e.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, filterStatus]);

  const fcEvents = useMemo(
    () =>
      filtered.map((e) => ({
        id: e.id,
        title: e.companyName,
        start: e.time,
        color: statusColor[e.status],
        extendedProps: e,
      })),
    [filtered],
  );

  const resetForm = () => {
    setCompanyName('');
    setLink('');
    setDescription('');
    setDate('');
    setTime('');
    setStatus('upcoming');
  };

  const openCreate = (iso?: string) => {
    resetForm();
    if (iso) {
      const d = new Date(iso);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
    }
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (item: InterviewEvent) => {
    setEditing(item);
    setCompanyName(item.companyName);
    setLink(item.link || '');
    setDescription(item.description || '');
    const d = new Date(item.time);
    setDate(d.toISOString().slice(0, 10));
    setTime(d.toTimeString().slice(0, 5));
    setStatus(item.status);
    setOpen(true);
  };

  const saveEvent = () => {
    if (!companyName || !date || !time) {
      toast.error('Fill in Company Name, Date and Time');
      return;
    }
    const iso = new Date(`${date}T${time}:00`).toISOString();
    if (editing) {
      const updated: InterviewEvent = { ...editing, companyName, link, description, time: iso, status };
      setEvents((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      toast.success('Event updated');
    } else {
      const created: InterviewEvent = { id: uuid(), companyName, link, description, time: iso, status };
      setEvents((prev) => [...prev, created]);
      toast.success('Event added');
    }
    setOpen(false);
  };

  const deleteEvent = () => {
    if (!editing) return;
    setEvents((prev) => prev.filter((e) => e.id !== editing.id));
    setOpen(false);
    toast.success('Event deleted');
  };

  const syncWithGoogle = () => {
    toast.info('Google Calendar sync will be available soon');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-xl font-semibold">Interview Calendar</h2>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search by company" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => openCreate()}>Add Event</Button>
          <Button variant="outline" onClick={syncWithGoogle}>Sync with Google</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2">
          <FullCalendar
            ref={calendarRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            events={fcEvents}
            height="75vh"
            dateClick={(info) => openCreate(info.dateStr)}
            eventClick={(info) => {
              const ext = info.event.extendedProps as any as InterviewEvent;
              if (ext) openEdit(ext);
            }}
            eventDidMount={(arg) => {
              const ext = arg.event.extendedProps as any as InterviewEvent;
              const tip = `${ext.companyName}\n${ext.description || ''}\n${new Date(ext.time).toLocaleString()}`;
              arg.el.setAttribute('title', tip);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Link</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {editing && (
              <Button variant="destructive" onClick={deleteEvent}>Delete</Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
