import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getConversations, getMessages, sendMessage } from '@/api/chat';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversationId')
    ? parseInt(searchParams.get('conversationId')!)
    : null;

  const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConvId);

  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
    isError: isConversationsError,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessage({ conversationId: activeConversationId!, content }),
    onSuccess: (newMessage) => {
      // Optimistically append to message list
      queryClient.setQueryData(
        ['messages', activeConversationId],
        (old: any) => (old ? [...old, newMessage] : [newMessage])
      );
      // Refresh sidebar so lastMessage updates
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (content: string) => {
    if (!activeConversationId) return;
    sendMutation.mutate(content);
  };

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
    setSearchParams({ conversationId: id.toString() });
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  if (isConversationsError) {
    return (
      <Card className="flex h-[calc(100vh-120px)] min-h-[500px] w-full items-center justify-center border">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="font-medium">Failed to load conversations</p>
          <p className="text-sm mt-1">Please refresh the page and try again.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-[calc(100vh-120px)] min-h-[500px] w-full overflow-hidden border">
      {/* Sidebar */}
      <div className="w-full max-w-[320px] flex-col border-r bg-muted/10 flex sm:flex md:w-80">
        <div className="flex h-16 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isConversationsLoading}
            userRole={user?.role}
          />
        </div>
      </div>

      {/* Chat area */}
      <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          currentUserId={user?.id || -1}
          isLoadingMessages={isMessagesLoading}
          onSendMessage={handleSendMessage}
          isSendingMessage={sendMutation.isPending}
        />
      </div>
    </Card>
  );
};

export default ChatPage;
