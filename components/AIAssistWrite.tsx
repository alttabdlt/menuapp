import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Textarea } from "./ui/Textarea";
import { Loader2 } from 'lucide-react';

interface AIAssistWriteProps {
  onGenerate: (text: string) => void;
  placeholder: string;
}

export function AIAssistWrite({ onGenerate, placeholder }: AIAssistWriteProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      onGenerate(data.text);
    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate with AI'
        )}
      </Button>
    </div>
  );
}