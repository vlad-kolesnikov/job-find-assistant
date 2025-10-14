import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bot, Send, Trash2, Download, RefreshCw, User } from 'lucide-react';

type Role = 'user' | 'assistant' | 'system';
type Message = { id: string; role: Role; content: string };
type Session = { id: string; title: string; createdAt: number; messages: Message[] };

const AGENT_ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT || '/api/my-gpt-agent';
const STORAGE_KEY = 'agent:sessions';
const ACTIVE_KEY = 'agent:activeSessionId';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function renderMarkdown(md: string) {
  // Very small, safe-ish markdown renderer: paragraphs, code blocks, bold, italics, inline code, lists
  let html = escapeHtml(md);
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre class="rounded-md bg-muted p-3 overflow-x-auto"><code>${escapeHtml(code)}</code></pre>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5">$1</code>');
  // simple unordered lists
  html = html.replace(/(^|\n)[\-\*] (.*)(?=\n|$)/g, (_m, p1, item) => `${p1}<li>${item}</li>`);
  html = html.replace(/(<li>.*<\/li>)(?:(\n<li>.*<\/li>))*/g, (m) => `<ul class="list-disc pl-6 space-y-1">${m}</ul>`);
  // paragraphs
  html = html
    .split(/\n{2,}/)
    .map((block) => (block.match(/^<pre/) || block.match(/^<ul/) ? block : `<p>${block.replace(/\n/g, '<br/>')}</p>`))
    .join('\n');
  return html;
}

const Agent = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'qa' | 'managerial'>('technical');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load sessions
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Session[] | null = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.length) {
      setSessions(parsed);
      const lastActive = localStorage.getItem(ACTIVE_KEY);
      setActiveId(lastActive || parsed[0].id);
    } else {
      const s: Session = { id: uuid(), title: 'New chat', createdAt: Date.now(), messages: [] };
      setSessions([s]);
      setActiveId(s.id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeId, typing, loading]);

  const active = useMemo(() => sessions.find((s) => s.id === activeId) || null, [sessions, activeId]);

  const newSession = () => {
    const s: Session = { id: uuid(), title: 'New chat', createdAt: Date.now(), messages: [] };
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  };

  const resetSession = () => {
    if (!active) return;
    const updated: Session = { ...active, messages: [], title: 'New chat' };
    setSessions((prev) => prev.map((s) => (s.id === active.id ? updated : s)));
  };

  const exportChat = (format: 'txt' | 'md') => {
    if (!active) return;
    const lines = active.messages.map((m) => `${m.role === 'assistant' ? 'Agent' : 'You'}:\n${m.content}`);
    const content = lines.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-chat-${new Date(active.createdAt).toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!input.trim() || !active || loading) return;
    const userMsg: Message = { id: uuid(), role: 'user', content: input.trim() };
    const nextMessages = [...active.messages, userMsg];
    const newTitle = active.title === 'New chat' ? userMsg.content.slice(0, 40) : active.title;
    setSessions((prev) => prev.map((s) => (s.id === active.id ? { ...s, messages: nextMessages, title: newTitle } : s)));
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      const res = await fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          simulation,
          interviewType,
          history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const reply = (data.reply || data.text || data.choices?.[0]?.message?.content || '').toString();
      const botMsg: Message = { id: uuid(), role: 'assistant', content: reply || '…' };
      setSessions((prev) => prev.map((s) => (s.id === active.id ? { ...s, messages: [...nextMessages, botMsg] } : s)));
    } catch (e: any) {
      console.error(e);
      toast.error('Не удалось получить ответ от агента');
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const repeatQuestion = async () => {
    setInput('Можешь переформулировать предыдущий вопрос сложнее?');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Sessions sidebar */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Interview Coach</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={newSession}>New chat</Button>
            <Button variant="outline" onClick={() => resetSession()}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {sessions.map((s) => (
              <Button key={s.id} variant={s.id === activeId ? 'default' : 'ghost'} className="w-full justify-start"
                onClick={() => setActiveId(s.id)}>
                {s.title || 'New chat'}
              </Button>
            ))}
          </div>
          <hr className="border-border" />
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Режим</div>
            <div className="flex gap-2">
              <Button variant={simulation ? 'default' : 'outline'} onClick={() => setSimulation(true)}>Симуляция</Button>
              <Button variant={!simulation ? 'default' : 'outline'} onClick={() => setSimulation(false)}>Обычный</Button>
            </div>
            <div className="text-sm text-muted-foreground">Тип интервью</div>
            <Select value={interviewType} onValueChange={(v: any) => setInterviewType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Тип интервью" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Техническое</SelectItem>
                <SelectItem value="behavioral">Поведенческое</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
                <SelectItem value="managerial">Менеджерское</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => exportChat('md')}><Download className="mr-2 h-4 w-4" />Export</Button>
              <Button variant="outline" onClick={repeatQuestion}><RefreshCw className="mr-2 h-4 w-4" />Repeat</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="lg:col-span-9 flex flex-col">
        <CardHeader>
          <CardTitle>Диалог</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[70vh]">
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-4">
              {(active?.messages || []).map((m) => (
                <div key={m.id} className={`flex items-start gap-3 ${m.role === 'assistant' ? '' : 'justify-end'}`}>
                  {m.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage />
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-6 ${m.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                  {m.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {typing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block size-2 rounded-full bg-muted-foreground/60 animate-pulse" />
                  Agent is typing…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="mt-3 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите вопрос или начните симуляцию интервью…"
              className="min-h-[44px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
            <Button variant="outline" onClick={resetSession}><Trash2 className="h-4 w-4 mr-2" />Reset chat</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agent;
