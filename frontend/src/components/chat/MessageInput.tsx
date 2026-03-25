import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {/* Optional Placeholder Typing Indicator Room */}
      <div className="h-6 mb-1 text-xs text-muted-foreground flex items-center italic">
        {/* Placeholder for "User is typing..." */}
      </div>
      
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border bg-muted/50 p-1 px-4"
      >
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors"
          title="Attach file (placeholder)"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          disabled={isLoading}
        />

        <button
          type="button"
          className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors hidden sm:block"
          title="Add emoji (placeholder)"
        >
          <Smile className="h-5 w-5" />
        </button>

        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          disabled={!content.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
};
