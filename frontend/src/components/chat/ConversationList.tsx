import React from 'react';
import { Conversation, approveChat, rejectChat } from '@/api/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  isLoading: boolean;
  userRole?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading,
  userRole,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: approveChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ description: 'Chat request approved' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ description: 'Chat request rejected' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-muted"></div>
              <div className="h-3 w-3/4 rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <MessageCircle className="mb-2 h-10 w-10 opacity-20" />
        <p>No conversations yet</p>
        <p className="text-sm">Start chatting with your connections.</p>
      </div>
    );
  }

  const renderConversation = (conv: Conversation) => (
    <button
      key={conv.id}
      onClick={() => onSelectConversation(conv.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
        activeConversationId === conv.id ? "bg-muted" : "bg-transparent"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conv.user.avatar} alt={conv.user.name} />
          <AvatarFallback>{conv.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="truncate font-medium flex items-center gap-2">
            {conv.user.name}
            {!conv.isApproved && conv.type === 'DIRECT' && userRole === 'STUDENT' && (
              <span className="inline-flex items-center rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-semibold text-warning border border-warning/20">
                Pending
              </span>
            )}
          </span>
          {conv.lastMessageTime && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="truncate text-xs text-muted-foreground">
            {conv.lastMessage || (conv.isApproved ? "Start chatting" : "Pending request")}
          </span>
          {conv.unreadCount && conv.unreadCount > 0 ? (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground ml-2">
              {conv.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );

  const pendingRequests = conversations.filter(c => c.type === 'DIRECT' && !c.isApproved && userRole === 'FACULTY');
  const appointmentChats = conversations.filter(c => c.type === 'APPOINTMENT' && c.isApproved);
  const directChats = conversations.filter(c => c.type === 'DIRECT' && (c.isApproved || userRole === 'STUDENT'));

  return (
    <div className="flex flex-col p-2 space-y-4">
      {/* Pending Requests ONLY FOR FACULTY */}
      {pendingRequests.length > 0 && (
        <div className="space-y-1">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="flex flex-col gap-1">
            {pendingRequests.map(conv => (
              <div key={conv.id} className="flex flex-col bg-muted/30 rounded-lg p-3 border border-warning/20">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{conv.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium text-sm flex items-center">{conv.user.name}</span>
                    <span className="text-xs text-muted-foreground">Wants to message you</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs flex-1"
                    onClick={() => approveMutation.mutate(conv.id)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={() => rejectMutation.mutate(conv.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Chats */}
      {appointmentChats.length > 0 && (
        <div className="space-y-1">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Appointments
          </h3>
          <div className="flex flex-col gap-1">
            {appointmentChats.map(renderConversation)}
          </div>
        </div>
      )}

      {/* Direct Chats */}
      {directChats.length > 0 && (
        <div className="space-y-1">
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Direct Messages
          </h3>
          <div className="flex flex-col gap-1">
            {directChats.map(renderConversation)}
          </div>
        </div>
      )}
    </div>
  );
};
