import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getConversations, getMessages, markRead, Message, PendingMediaMessage } from '@/api/chat';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CallOverlay } from '@/components/CallOverlay';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { getUploadSignature, uploadFileToCloudinary } from '@/api/upload';
import { useCall } from '@/hooks/useCall';
import { queryKeys } from '@/lib/queryKeys';

// 50 MB — matches the backend multer limit
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

type SocketAckOk = { ok: true; message: Message };
type SocketAckFail = { ok: false; error?: string };
type SocketAck = SocketAckOk | SocketAckFail;

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaMessage | null>(null);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [isContactsCollapsed, setIsContactsCollapsed] = useState(false);
  const [isMobileContactsOpen, setIsMobileContactsOpen] = useState(false);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Typing indicator state: name of who is typing (null if nobody)
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialConvId = searchParams.get('conversationId')
    ? parseInt(searchParams.get('conversationId')!, 10)
    : null;
  const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConvId);
  const selectedConversationId = activeConversationId ?? -1;

  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
    isError: isConversationsError,
  } = useQuery({ queryKey: queryKeys.conversations(), queryFn: getConversations });

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: queryKeys.messages(selectedConversationId),
    queryFn: () => getMessages(selectedConversationId),
    enabled: !!activeConversationId,
  });

  // ─── Sync URL param → state ──────────────────────────────────────────────
  useEffect(() => {
    setActiveConversationId(initialConvId);
  }, [initialConvId]);

  // Auto-select first conversation
  useEffect(() => {
    if (activeConversationId || !conversations.length) return;
    const first = conversations[0];
    setActiveConversationId(first.id);
    setSearchParams({ conversationId: first.id.toString() });
  }, [activeConversationId, conversations, setSearchParams]);

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
    setSearchParams({ conversationId: id.toString() });
    setIsMobileContactsOpen(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(id) });
    // Mark messages read when switching conversations
    markRead(id).catch(() => {/* best-effort */});
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
  };

  const handleToggleContacts = useCallback(() => {
    if (window.innerWidth < 768) {
      setIsMobileContactsOpen((prev) => !prev);
      return;
    }
    setIsContactsCollapsed((prev) => !prev);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const {
    localStream,
    remoteStream,
    callStatus,
    callType,
    callerId,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  } = useCall({
    currentUserId: user?.id,
    onError: (message: string) => {
      toast({ description: message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!remoteStream) return;

    if (remoteAudioRef.current && callType !== 'video') {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {
        // Browser autoplay policies can block without user interaction.
      });
    }
  }, [remoteStream, callType]);

  const handleStartCall = useCallback(
    async (targetUserId: number, options: { video: boolean } = { video: false }) => {
      if (!targetUserId) return;
      const selectedUser = conversations.find((conversation) => conversation.user.id === targetUserId)?.user;
      if (!selectedUser?.id) return;
      const started = await startCall(selectedUser.id, options);
      if (!started) return;
    },
    [conversations, startCall]
  );

  const callerConversation =
    callerId != null ? conversations.find((conversation) => conversation.user.id === callerId) : null;

  // ─── Socket: join room + receive messages + typing events ────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConversationId) return;

    socket.emit('join_conversation', { conversationId: activeConversationId });

    const handleReceiveMessage = (message: Message) => {
      // Clear pending bubble when our own media message comes back confirmed
      if (message.senderId === user?.id && message.mediaUrl) {
        setPendingMedia(null);
        setIsUploadingMedia(false);
      }

      // Message is for a different conversation — just refresh sidebar
      if (message.conversationId !== activeConversationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
        return;
      }

      queryClient.setQueryData<Message[]>(
        queryKeys.messages(activeConversationId),
        (old = []) => (old.some((m) => m.id === message.id) ? old : [...old, message])
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });

      // Mark read immediately if the active conversation gets a new message
      if (message.senderId !== user?.id) {
        markRead(activeConversationId).catch(() => {/* best-effort */});
      }
    };

    // ── Typing indicator handlers ────────────────────────────────────────────
    const handleUserTyping = ({ conversationId, name }: { conversationId: number; name: string }) => {
      if (conversationId !== activeConversationId) return;
      setTypingUser(name);
      // Auto-clear after 3s as a safety net in case typing_stop is missed
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
    };

    const handleUserStoppedTyping = ({ conversationId }: { conversationId: number }) => {
      if (conversationId !== activeConversationId) return;
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      setTypingUser(null);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.emit('leave_conversation', { conversationId: activeConversationId });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      // Clear any pending typing indicator when leaving the conversation
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      setTypingUser(null);
    };
  }, [activeConversationId, queryClient, user?.id]);

  // Mark conversation read when messages first load
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      markRead(activeConversationId).catch(() => {/* best-effort */});
    }
  }, [activeConversationId, messages.length]);

  // ─── Typing event emitters ────────────────────────────────────────────────
  const handleTypingStart = useCallback(() => {
    if (!activeConversationId) return;
    getSocket()?.emit('typing_start', { conversationId: activeConversationId });
  }, [activeConversationId]);

  const handleTypingStop = useCallback(() => {
    if (!activeConversationId) return;
    getSocket()?.emit('typing_stop', { conversationId: activeConversationId });
  }, [activeConversationId]);

  // ─── Send text message via socket (real-time) ────────────────────────────
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleSendMessage = (content: string) => {
    if (!activeConversationId) return;
    const socket = getSocket();

    if (!socket) {
      toast({ description: 'Socket connection unavailable', variant: 'destructive' });
      return;
    }

    setIsSendingMessage(true);
    socket.emit(
      'send_message',
      { conversationId: activeConversationId, content },
      (ack: SocketAck) => {
        setIsSendingMessage(false);
        if (!ack.ok) {
          const fail = ack as SocketAckFail;
          toast({
            description: fail.error || 'Failed to send message',
            variant: 'destructive',
          });
        }
      }
    );
  };

  // ─── Upload file → Cloudinary (signed) → emit send_media ────────────────
  const handleSendMedia = async (file: File) => {
    if (!activeConversationId || !user?.id) return;

    const isAllowedType =
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('excel') ||
      file.type.includes('spreadsheet');

    if (!isAllowedType) {
      toast({ description: 'Unsupported file type', variant: 'destructive' });
      return;
    }

    if (file.size > MAX_MEDIA_BYTES) {
      toast({ description: 'File must be 50 MB or less', variant: 'destructive' });
      return;
    }

    const socket = getSocket();
    if (!socket) {
      toast({ description: 'Socket connection unavailable', variant: 'destructive' });
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    const previewUrlToRevoke = previewUrl; // capture for cleanup
    setLastSelectedFile(file);
    setIsUploadingMedia(true);
    setPendingMedia({
      id: `pending-${Date.now()}`,
      conversationId: activeConversationId,
      senderId: user.id,
      fileName: file.name,
      fileType: file.type,
      previewUrl,
      status: 'uploading',
      createdAt: new Date().toISOString(),
    });

    try {
      // Step 1: Get signature from backend (pass mimetype so backend returns the correct mediaType)
      console.log('[media-upload] Getting signature...');
      const signature = await getUploadSignature(file.type);

      // Step 2: Upload directly to Cloudinary
      console.log('[media-upload] Uploading to Cloudinary...');
      const cloudinaryResponse = await uploadFileToCloudinary(file, signature);
      console.log('[media-upload] Upload success');

      const { secure_url: mediaUrl } = cloudinaryResponse;
      // Use the mediaType from the backend signature — it's derived from the real MIME type,
      // not Cloudinary's resource_type (which returns 'raw' for PDFs/docs).
      const mediaType = signature.mediaType;
      console.log('[media-upload] preparing DB payload', {
        mediaUrl,
        mediaType,
      });

      // Step 3: Emit socket event to save message (increased timeout for large files)
      const ack = await new Promise<SocketAck>((resolve, reject) => {
        socket.timeout(30000).emit( // Increased from 15s to 30s
          'send_media',
          { 
            conversationId: activeConversationId, 
            mediaUrl, 
            mediaType,
            bytes: file.size 
          },
          (error: Error | null, response: SocketAck) => {
            if (error) return reject(error);
            resolve(response);
          }
        );
      });

      if (!ack.ok) {
        const fail = ack as SocketAckFail;
        throw new Error(fail.error || 'Failed to save media message');
      }

      // Optimistically add the confirmed message
      if (ack.ok && ack.message) {
        queryClient.setQueryData<Message[]>(
          queryKeys.messages(activeConversationId),
          (old = []) => (old.some((m) => m.id === ack.message!.id) ? old : [...old, ack.message!])
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      }

      setPendingMedia(null);
    } catch (error: any) {
      console.error('[handleSendMedia] error', error);
      setPendingMedia((cur) =>
        cur ? { ...cur, status: 'failed', error: error?.message || 'Upload failed' } : null
      );
      toast({
        description: error?.message || 'Failed to upload media',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingMedia(false);
      // Revoke the object URL to release memory — fixes the URL leak
      if (previewUrlToRevoke) {
        URL.revokeObjectURL(previewUrlToRevoke);
      }
    }
  };

  const handleRetryMediaUpload = () => {
    if (lastSelectedFile) handleSendMedia(lastSelectedFile);
  };

  if (isConversationsError) {
    return (
      <Card className="flex h-full min-h-0 w-full items-center justify-center border">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="font-medium">Failed to load conversations</p>
          <p className="text-sm mt-1">Please refresh the page and try again.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="chat-page relative h-full min-h-0 w-full border">
      {/* Contacts panel */}
      <div
        className={`chat-sidebar absolute inset-y-0 left-0 z-20 w-[85vw] max-w-[320px] border-r bg-muted/10 transition-transform duration-300 md:static md:max-w-none md:translate-x-0 ${
          isMobileContactsOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isContactsCollapsed
            ? 'md:w-0 md:min-w-0 md:overflow-hidden md:border-r-0'
            : 'md:w-[280px] md:min-w-[250px] lg:w-[320px] lg:min-w-[300px]'
        }`}
      >
        <div className="h-full min-h-0 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isConversationsLoading}
            userRole={user?.role}
          />
        </div>
      </div>

      {isMobileContactsOpen && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-foreground/30 md:hidden"
          onClick={() => setIsMobileContactsOpen(false)}
          aria-label="Close conversations panel"
        />
      )}

      {/* Chat area */}
      <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} chat-area`}>
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          pendingMedia={pendingMedia}
          currentUserId={user?.id || -1}
          isLoadingMessages={isMessagesLoading}
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          onRetryMediaUpload={handleRetryMediaUpload}
          isSendingMessage={isSendingMessage}
          isUploadingMedia={isUploadingMedia}
          typingUser={typingUser ?? undefined}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onToggleContacts={handleToggleContacts}
          onStartCall={handleStartCall}
          isCallDisabled={
            !activeConversation ||
            callStatus !== 'idle'
          }
        />
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {callStatus !== 'idle' && (
        <CallOverlay
          callStatus={callStatus}
          callType={callType}
          localStream={localStream}
          remoteStream={remoteStream}
          user={{
            name:
              callStatus === 'incoming'
                ? callerConversation?.user.name ?? 'Unknown user'
                : activeConversation?.user.name ?? 'Unknown user',
            avatar:
              callStatus === 'incoming'
                ? callerConversation?.user.avatar
                : activeConversation?.user.avatar,
          }}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onAcceptCall={() => {
            void acceptCall();
          }}
          onEndCall={() => {
            if (callStatus === 'incoming') {
              rejectCall();
              return;
            }
            endCall();
          }}
        />
      )}
    </Card>
  );
};

export default ChatPage;
