import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Mail, RefreshCw, ExternalLink, ClipboardCopy, Filter, Sparkles } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
type MailFilter = 'all' | 'important' | 'applications' | 'interviews' | 'followup';

type EmailItem = {
  id: string;
  sender: string; // e.g., "HR <hr@company.com>"
  subject: string;
  preview: string;
  date: string; // ISO string
  body?: string;
  labels?: string[];
  analyzed?: {
    summary: string;
    tone: string;
    priority: Priority;
    draft_reply: string;
  };
  processed?: boolean;
};

const GMAIL_AUTH_URL = import.meta.env.VITE_GMAIL_AUTH_URL || '/api/gmail/auth';
const GMAIL_EMAILS_ENDPOINT = import.meta.env.VITE_GMAIL_EMAILS_ENDPOINT || '/api/gmail/emails';
const MAIL_AGENT_ENDPOINT = import.meta.env.VITE_MAIL_AGENT_ENDPOINT || '/api/mail-agent-gpt';
const STORAGE_AUTH = 'mail:connected';
const STORAGE_EMAILS = 'mail:emails';

function parseEmailAddress(sender: string): string | undefined {
  const m = sender.match(/<([^>]+)>/);
  if (m) return m[1];
  if (sender.includes('@')) return sender.trim();
  return undefined;
}

function priorityBadge(p?: Priority) {
  if (!p) return null;
  const color = p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-500' : 'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

const MailAgent = () => {
  const [connected, setConnected] = useState<boolean>(() => localStorage.getItem(STORAGE_AUTH) === '1');
  const [filter, setFilter] = useState<MailFilter>('all');
  const [search, setSearch] = useState('');
  const [smartSort, setSmartSort] = useState(true);
  const [emails, setEmails] = useState<EmailItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_EMAILS);
    return raw ? (JSON.parse(raw) as EmailItem[]) : [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const selected = useMemo(() => emails.find((e) => e.id === selectedId), [emails, selectedId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_EMAILS, JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    // Handle auth callback query like ?gmail_connected=1
    const url = new URL(window.location.href);
    const flag = url.searchParams.get('gmail_connected');
    if (flag === '1') {
      setConnected(true);
      localStorage.setItem(STORAGE_AUTH, '1');
      url.searchParams.delete('gmail_connected');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const filteredList = useMemo(() => {
    let list = [...emails];
    if (filter !== 'all') {
      list = list.filter((e) => {
        const text = `${e.subject} ${e.preview} ${(e.body || '')}`.toLowerCase();
        switch (filter) {
          case 'important':
            return (e.analyzed?.priority || 'low') !== 'low';
          case 'applications':
            return /vacancy|вакан|job|отклик|resume|резюме/i.test(text);
          case 'interviews':
            return /interview|интервью|собеседован/i.test(text);
          case 'followup':
            return /follow.?up|фоллоу.?ап|напоминан/i.test(text);
        }
      });
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((e) => `${e.sender} ${e.subject} ${e.preview}`.toLowerCase().includes(s));
    }
    if (smartSort) {
      const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => (order[a.analyzed?.priority || 'low'] - order[b.analyzed?.priority || 'low']) || (b.date.localeCompare(a.date)));
    } else {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [emails, filter, search, smartSort]);

  const connectGmail = () => {
    window.location.href = GMAIL_AUTH_URL; // backend должен редиректить в Google OAuth и вернуть обратно с ?gmail_connected=1
  };

  const refreshEmails = async () => {
    try {
      const res = await fetch(GMAIL_EMAILS_ENDPOINT);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const list: EmailItem[] = data.emails || [];
      setEmails(list);
      if (list.length) setSelectedId(list[0].id);
      toast.success('Mail updated');
    } catch (e) {
      toast.error('Failed to load emails. Check backend /api/gmail/emails');
    }
  };

  const analyzeEmail = async (email: EmailItem) => {
    setAnalysisLoading(true);
    try {
      const res = await fetch(MAIL_AGENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_subject: email.subject, email_body: email.body || email.preview }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const updated: EmailItem = {
        ...email,
        analyzed: {
          summary: data.summary || '',
          tone: data.tone || '',
          priority: (data.priority as Priority) || 'medium',
          draft_reply: data.draft_reply || '',
        },
        processed: true,
      };
      setEmails((prev) => prev.map((e) => (e.id === email.id ? updated : e)));
      toast.success('Analysis complete');
    } catch (e) {
      toast.error('Email analysis error. Check /api/mail-agent-gpt');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const openInGmailCompose = (email: EmailItem) => {
    const to = encodeURIComponent(parseEmailAddress(email.sender) || '');
    const su = encodeURIComponent('Re: ' + email.subject);
    const body = encodeURIComponent(email.analyzed?.draft_reply || '');
    const url = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${to}&su=${su}&body=${body}`;
    window.open(url, '_blank');
  };

  const copyDraft = async (email: EmailItem) => {
    if (!email.analyzed?.draft_reply) return;
    await navigator.clipboard.writeText(email.analyzed.draft_reply);
    toast.success('Draft copied');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* Left: Filters */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Mail Agent</CardTitle>
          <CardDescription>
            Analyze and manage your job-related emails with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={connected ? refreshEmails : connectGmail} className="flex-1">
              {connected ? (<><RefreshCw className="mr-2 h-4 w-4" /> Refresh emails</>) : (<><Mail className="mr-2 h-4 w-4" /> Check emails</>)}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">Filters</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={filter==='all'?'default':'outline'} onClick={()=>setFilter('all')}>All</Button>
            <Button variant={filter==='important'?'default':'outline'} onClick={()=>setFilter('important')}>Important</Button>
            <Button variant={filter==='applications'?'default':'outline'} onClick={()=>setFilter('applications')}>Applications</Button>
            <Button variant={filter==='interviews'?'default':'outline'} onClick={()=>setFilter('interviews')}>Interviews</Button>
            <Button variant={filter==='followup'?'default':'outline'} onClick={()=>setFilter('followup')}>Follow‑up</Button>
            <Button variant={smartSort?'default':'outline'} onClick={()=>setSmartSort((v)=>!v)}>Smart Sort</Button>
          </div>
          <Separator />
          <Input placeholder="Search by subject/sender" value={search} onChange={(e)=>setSearch(e.target.value)} />
        </CardContent>
      </Card>

      {/* Middle: list */}
      <Card className="xl:col-span-4 flex flex-col">
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[70vh]">
            <div className="divide-y">
              {filteredList.map((e) => (
                <button key={e.id} className={`w-full text-left p-3 hover:bg-accent transition ${selectedId===e.id?'bg-accent':''}`} onClick={()=>setSelectedId(e.id)}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate max-w-[70%]">{e.subject}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">{e.sender}</div>
                  <div className="mt-1 text-sm truncate flex items-center gap-2">
                    {priorityBadge(e.analyzed?.priority)}
                    <span className="truncate">{e.preview}</span>
                    {e.processed && <Badge variant="secondary">✅ Processed</Badge>}
                  </div>
                </button>
              ))}
              {filteredList.length===0 && (
                <div className="p-6 text-sm text-muted-foreground">No emails for current filters</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: detail + GPT */}
      <Card className="xl:col-span-5">
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selected ? (
            <>
              <div>
                <div className="text-sm text-muted-foreground">From: {selected.sender}</div>
                <div className="font-semibold text-lg">{selected.subject}</div>
                <div className="text-sm text-muted-foreground">{new Date(selected.date).toLocaleString()}</div>
              </div>
              <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap leading-6 max-h-[30vh] overflow-auto">
                {selected.body || selected.preview}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={()=>analyzeEmail(selected)} disabled={analysisLoading}>
                  <Sparkles className="h-4 w-4 mr-2" />{analysisLoading?'Анализ…':'Анализ GPT'}
                </Button>
                <Button variant="outline" onClick={()=>openInGmailCompose(selected)}>
                  <ExternalLink className="h-4 w-4 mr-2" />Открыть в Gmail
                </Button>
                <Button variant="outline" onClick={()=>copyDraft(selected)} disabled={!selected.analyzed?.draft_reply}>
                  <ClipboardCopy className="h-4 w-4 mr-2" />Копировать ответ
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="font-medium">Ответ от GPT</div>
                {selected.analyzed ? (
                  <div className="space-y-2">
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <div>Тон: <span className="font-medium text-foreground">{selected.analyzed.tone}</span></div>
                      <div>Приоритет: <span className="font-medium text-foreground">{selected.analyzed.priority}</span></div>
                    </div>
                    <div className="text-sm leading-6">{selected.analyzed.summary}</div>
                    <Textarea readOnly value={selected.analyzed.draft_reply} className="min-h-[180px]" />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Нажмите “Анализ GPT”, чтобы получить резюме, тон, приоритет и черновик ответа.</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Выберите письмо слева, чтобы посмотреть детали.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MailAgent;
