import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Send, Smile, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendMedia?: (file: File) => void;
  isLoading?: boolean;
  isUploading?: boolean;
  typingUser?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendMedia,
  isLoading,
  isUploading,
  typingUser,
  onTypingStart,
  onTypingStop,
}) => {
  const [content, setContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track whether we've already fired typing_start so we don't spam it
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireTypingStop = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
  }, [onTypingStop]);

  // ── Memory-leak fix: clear the debounce timer when the component unmounts ──
  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
      // Also fire stop in case the user was mid-typing when the component unmounted
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop?.();
      }
    };
    // onTypingStop is intentionally excluded — we only want this to run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    if (e.target.value.trim()) {
      // Emit typing_start only on the first keystroke of a new typing session
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart?.();
      }
      // Reset the idle-stop timer
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = setTimeout(fireTypingStop, 2000);
    } else {
      // Field cleared — stop immediately
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      fireTypingStop();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading && !isUploading) {
      // Stop typing indicator immediately on send
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      fireTypingStop();

      onSendMessage(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onSendMedia && !isUploading) {
      onSendMedia(file);
    }
    // Reset so the same file can be re-selected after a retry
    event.target.value = '';
  };

  const placeholder = isUploading
    ? 'Uploading file…'
    : 'Type a message…';

  return (
    <div className="border-t bg-background p-4">
      {/* Typing indicator label */}
      {typingUser && !isUploading && (
        <p className="mb-1 px-2 text-xs text-muted-foreground animate-pulse">
          {typingUser} is typing…
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border bg-muted/50 p-1 px-4"
      >
        {/* Hidden file input — accepts everything the backend accepts */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attach button */}
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors disabled:opacity-40"
          title={isUploading ? 'Uploading…' : 'Attach file'}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isLoading}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>

        <Input
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          disabled={isLoading || isUploading}
        />

        <button
          type="button"
          className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors hidden sm:block"
          title="Emoji (coming soon)"
        >
          <Smile className="h-5 w-5" />
        </button>

        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          disabled={!content.trim() || isLoading || isUploading}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
};