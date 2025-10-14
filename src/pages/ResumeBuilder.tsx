import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { buildResumePrompt } from '@/lib/promptTemplates';
import { toast } from 'sonner';
import { Loader2, FileDown, ClipboardCopy, Wand2 } from 'lucide-react';

const DEFAULT_ENDPOINT = '/api/gpt';

const ResumeBuilder = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [userResume, setUserResume] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => import.meta.env.VITE_GPT_ENDPOINT || DEFAULT_ENDPOINT, []);
  const prompt = useMemo(() => buildResumePrompt(jobDescription, userResume), [jobDescription, userResume]);

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !userResume.trim()) {
      toast.error('Заполните описание вакансии и исходное резюме');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      let text = '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        text = data.text || data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
      } else {
        text = await res.text();
      }
      setResult(text);
    } catch (e: any) {
      console.error(e);
      toast.error('Не удалось получить ответ от GPT API. Укажите рабочий endpoint в VITE_GPT_ENDPOINT.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success('Скопировано в буфер обмена');
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adapted-resume-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Resume Builder</h2>
        <p className="text-sm text-muted-foreground">Сгенерируйте адаптированное резюме на основе вакансии и вашего исходного резюме.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Описание вакансии</CardTitle>
            <CardDescription>Вставьте полный текст вакансии</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Вставьте описание вакансии…"
              className="min-h-[260px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Исходное резюме</CardTitle>
            <CardDescription>Вставьте актуальную версию вашего резюме</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={userResume}
              onChange={(e) => setUserResume(e.target.value)}
              placeholder="Вставьте исходное резюме…"
              className="min-h-[260px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {loading ? 'Генерация…' : 'Сгенерировать резюме'}
        </Button>
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <Button variant="outline" onClick={handleCopy} disabled={!result}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Копировать Markdown
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={!result}>
          <FileDown className="mr-2 h-4 w-4" />
          Скачать .md
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
          <CardDescription>Ответ GPT на основе промпта</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <pre className="whitespace-pre-wrap text-sm leading-6">{result}</pre>
          ) : (
            <div className="text-sm text-muted-foreground">Здесь появится сгенерированный Markdown.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeBuilder;
