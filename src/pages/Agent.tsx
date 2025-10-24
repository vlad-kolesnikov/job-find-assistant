import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Agent = () => {
  const [gptUrl, setGptUrl] = useState('https://chatgpt.com/g/g-YOUR_GPT_ID');
  const [currentUrl, setCurrentUrl] = useState('');

  const handleLoadGpt = () => {
    if (gptUrl.trim()) {
      setCurrentUrl(gptUrl);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>QA-тренажер - Interview Coach</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={gptUrl}
              onChange={(e) => setGptUrl(e.target.value)}
              placeholder="Вставьте URL вашего GPT (например: https://chatgpt.com/g/g-...)"
              className="flex-1"
            />
            <Button onClick={handleLoadGpt}>Загрузить</Button>
          </div>
          
          {currentUrl ? (
            <div className="w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden border">
              <iframe
                src={currentUrl}
                className="w-full h-full"
                title="ChatGPT Custom GPT"
                allow="microphone; camera"
              />
            </div>
          ) : (
            <div className="w-full h-[calc(100vh-200px)] rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Вставьте URL вашего GPT выше</p>
                <p className="text-sm">Например: https://chatgpt.com/g/g-YOUR_GPT_ID</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Agent;
