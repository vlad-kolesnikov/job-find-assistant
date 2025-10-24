import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageSquare } from 'lucide-react';

const Agent = () => {
  const [gptUrl, setGptUrl] = useState('https://chatgpt.com/g/g-68f952623ff881918a3f6e7b822d14d3-qa-trenazher');

  const handleOpenGpt = () => {
    if (gptUrl.trim()) {
      window.open(gptUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            QA-тренажер - Interview Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={gptUrl}
              onChange={(e) => setGptUrl(e.target.value)}
              placeholder="Вставьте URL вашего GPT (например: https://chatgpt.com/g/g-...)"
              className="flex-1"
            />
            <Button onClick={handleOpenGpt} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Открыть GPT
            </Button>
          </div>
          
          <div className="w-full min-h-[calc(100vh-300px)] rounded-lg border bg-muted/30 flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-2xl">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">ChatGPT не поддерживает встраивание</h3>
                <p className="text-muted-foreground">
                  По соображениям безопасности ChatGPT блокирует встраивание через iframe
                </p>
              </div>
              
              <div className="space-y-4 text-left bg-background rounded-lg p-6 border">
                <h4 className="font-semibold text-lg">Как использовать GPT:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Вставьте URL вашего GPT в поле выше</li>
                  <li>Нажмите кнопку "Открыть GPT"</li>
                  <li>GPT откроется в новой вкладке браузера</li>
                </ol>
              </div>

              <Button onClick={handleOpenGpt} size="lg" className="gap-2">
                <ExternalLink className="h-5 w-5" />
                Открыть QA-тренажер
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agent;
