import React, { useEffect, useRef } from 'react';
import { Message } from '@/api/chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-50" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center text-muted-foreground h-full">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="font-medium">No messages yet</p>
        <p className="text-sm mt-1">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      ref={scrollRef}
    >
      {messages.map((message) => {
        const isMe = message.senderId === currentUserId;

        return (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              isMe ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] flex flex-col gap-1",
                isMe ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                <p className="break-words text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(message.createdAt), 'h:mm a')}
                </span>
                {isMe && message.status && (
                  <span className="text-[10px] text-muted-foreground">
                    {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
