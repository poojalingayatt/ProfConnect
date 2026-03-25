import React from 'react';
import { Conversation, Message } from '@/api/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Info, MoreVertical, Phone, Video } from 'lucide-react';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: number;
  isLoadingMessages: boolean;
  onSendMessage: (content: string) => void;
  isSendingMessage?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  isLoadingMessages,
  onSendMessage,
  isSendingMessage,
}) => {
  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-10 w-10 text-muted-foreground opacity-50"
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
          <h3 className="text-xl font-semibold">Your Messages</h3>
          <p className="max-w-xs text-muted-foreground mt-2">
            Select a conversation from the sidebar to view your chat or start a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
              <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
          </div>
          <div>
            <h3 className="font-semibold">{conversation.user.name}</h3>
            <p className="text-xs text-green-600 font-medium">Online</p>
          </div>
        </div>

        {/* Optional Context Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Info className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Message List Area */}
      <div className="flex-1 overflow-hidden relative bg-muted/10">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoadingMessages}
        />
      </div>

      {/* Input Area */}
      {!conversation.isApproved ? (
        <div className="border-t bg-muted/30 p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
          <Info className="h-6 w-6 mb-2 opacity-50" />
          <p className="font-medium text-sm">Waiting for approval</p>
          <p className="text-xs mt-1 max-w-sm">This direct message request is pending faculty approval. You will be able to message them once they accept.</p>
        </div>
      ) : (
        <MessageInput
          onSendMessage={onSendMessage}
          isLoading={isSendingMessage}
        />
      )}
    </div>
  );
};
