import React, { useEffect, useRef, useState } from 'react';
import { Message, PendingMediaMessage } from '@/api/chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FileText, Loader2, RefreshCcw, VideoIcon, Music, ArrowDown, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSignedMediaUrl } from '@/api/upload';

/** Human-readable file size, e.g. 2.3 MB */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Extract filename from URL */
function getFileName(url: string): string {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    // Remove query params
    return lastPart.split('?')[0] || 'file';
  } catch {
    return 'file';
  }
}

/** Detect file type from URL or mediaType */
function getFileType(url: string, mediaType?: string | null): 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'file' {
  // Check mediaType first — this is the most reliable signal
  if (mediaType === 'image') return 'image';
  if (mediaType === 'video') return 'video';
  if (mediaType === 'audio') return 'audio';
  // Backend labels PDFs as 'pdf' and Word/Excel as 'document'
  if (mediaType === 'pdf') return 'pdf';
  if (mediaType === 'document') return 'doc';

  // Fall back to URL extension — strip query-string first so Cloudinary URLs work
  // e.g. https://res.cloudinary.com/.../file.pdf?_a=... → 'pdf'
  let urlPath: string;
  try {
    urlPath = new URL(url).pathname.toLowerCase();
  } catch {
    urlPath = url.split('?')[0].toLowerCase();
  }

  if (urlPath.endsWith('.pdf')) return 'pdf';
  if (urlPath.endsWith('.doc') || urlPath.endsWith('.docx')) return 'doc';
  if (urlPath.endsWith('.xls') || urlPath.endsWith('.xlsx')) return 'doc';
  if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg') || urlPath.endsWith('.png') || urlPath.endsWith('.gif') || urlPath.endsWith('.webp')) return 'image';
  if (urlPath.endsWith('.mp4') || urlPath.endsWith('.webm') || urlPath.endsWith('.mov')) return 'video';
  if (urlPath.endsWith('.mp3') || urlPath.endsWith('.wav') || urlPath.endsWith('.ogg')) return 'audio';

  return 'file';
}

interface MessageListProps {
  messages: Message[];
  pendingMedia?: PendingMediaMessage | null;
  currentUserId: number;
  isLoading: boolean;
  onRetryUpload?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  pendingMedia,
  currentUserId,
  isLoading,
  onRetryUpload,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const openMediaInNewTab = async (
    mediaUrl: string,
    fileType: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'file'
  ) => {
    const popup = window.open('', '_blank');
    if (!popup) return;

    try {
      let targetUrl = mediaUrl;
      if (fileType === 'pdf' || fileType === 'doc' || fileType === 'file') {
        targetUrl = await getSignedMediaUrl(mediaUrl);
      }
      popup.location.href = targetUrl;
    } catch (error) {
      console.error('[chat.openMediaInNewTab] Failed to get signed media URL', error);
      popup.location.href = mediaUrl;
    }
  };

   const isNearBottomRef = useRef(true);

  // Check if user has scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
    isNearBottomRef.current = isNearBottom;
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // Auto-scroll to bottom when new messages arrive or pending media changes
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, pendingMedia]);

  // Initial scroll to bottom when loading completes
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-50" />
      </div>
    );
  }

  if (messages.length === 0 && !pendingMedia) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center text-muted-foreground h-full">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg className="h-8 w-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="font-medium">No messages yet</p>
        <p className="text-sm mt-1">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 hide-scrollbar"
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* ── Confirmed messages ── */}
      {messages.map((message) => {
        const isMe = message.senderId === currentUserId;
        const hasText = Boolean(message.content?.trim());
        const hasMedia = Boolean(message.mediaUrl);
        
        // Detect file type
        const fileType = hasMedia ? getFileType(message.mediaUrl!, message.mediaType) : null;
        const fileName = hasMedia ? getFileName(message.mediaUrl!) : '';

        return (
          <div 
            key={message.id} 
            className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
          >
            <div className={cn('max-w-[60%] flex flex-col gap-2', isMe ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'rounded-2xl px-3 py-2',
                  isMe
                    ? 'bg-[linear-gradient(135deg,hsl(238_75%_58%)_0%,hsl(258_75%_58%)_100%)] text-primary-foreground rounded-br-sm'
                    : 'bg-[#e6f0ff] text-[#1a1a1a] rounded-bl-sm border border-[#d3e4ff]'
                )}
              >
                {hasText && (
                  <p className="break-words text-sm whitespace-pre-wrap">{message.content}</p>
                )}

                {/* IMAGE */}
                {hasMedia && fileType === 'image' && (
                  <img
                    src={message.mediaUrl!}
                    alt="Shared image"
                    className={cn('rounded-lg object-cover max-h-64 cursor-pointer', hasText ? 'mt-2 w-full' : 'max-w-full')}
                    onClick={() => openMediaInNewTab(message.mediaUrl!, fileType)}
                  />
                )}

                {/* VIDEO */}
                {hasMedia && fileType === 'video' && (
                  <video
                    src={message.mediaUrl!}
                    controls
                    className={cn('rounded-lg max-h-64', hasText ? 'mt-2 w-full' : 'max-w-full')}
                  />
                )}

                {/* AUDIO */}
                {hasMedia && fileType === 'audio' && (
                  <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', hasText ? 'mt-2' : '',
                    isMe ? 'bg-primary-foreground/10' : 'bg-[#dce9ff]')}>
                    <Music className="h-4 w-4 shrink-0" />
                    <audio src={message.mediaUrl!} controls className="h-8 w-full" />
                  </div>
                )}

                {/* PDF */}
                {hasMedia && fileType === 'pdf' && (
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity',
                      hasText ? 'mt-2' : '',
                      isMe ? 'bg-primary-foreground/10' : 'bg-[#dce9ff]'
                    )}
                    onClick={() => openMediaInNewTab(message.mediaUrl!, fileType)}
                  >
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', isMe ? 'text-primary-foreground' : 'text-foreground')}>
                        {fileName}
                      </p>
                      <p className={cn('text-xs', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        PDF {message.bytes ? `· ${formatBytes(message.bytes)}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isMe ? 'secondary' : 'outline'}
                      className="flex-shrink-0 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaInNewTab(message.mediaUrl!, fileType);
                      }}
                    >
                      Open
                    </Button>
                  </div>
                )}

                {/* DOC/DOCX */}
                {hasMedia && fileType === 'doc' && (
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity',
                      hasText ? 'mt-2' : '',
                      isMe ? 'bg-primary-foreground/10' : 'bg-[#dce9ff]'
                    )}
                    onClick={() => openMediaInNewTab(message.mediaUrl!, fileType)}
                  >
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', isMe ? 'text-primary-foreground' : 'text-foreground')}>
                        {fileName}
                      </p>
                      <p className={cn('text-xs', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        Document {message.bytes ? `· ${formatBytes(message.bytes)}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isMe ? 'secondary' : 'outline'}
                      className="flex-shrink-0 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaInNewTab(message.mediaUrl!, fileType);
                      }}
                    >
                      Download
                    </Button>
                  </div>
                )}

                {/* GENERIC FILE */}
                {hasMedia && fileType === 'file' && (
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity',
                      hasText ? 'mt-2' : '',
                      isMe ? 'bg-primary-foreground/10' : 'bg-[#dce9ff]'
                    )}
                    onClick={() => openMediaInNewTab(message.mediaUrl!, fileType)}
                  >
                    <div className="flex-shrink-0">
                      <File className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', isMe ? 'text-primary-foreground' : 'text-foreground')}>
                        {fileName}
                      </p>
                      <p className={cn('text-xs', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        File {message.bytes ? `· ${formatBytes(message.bytes)}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isMe ? 'secondary' : 'outline'}
                      className="flex-shrink-0 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaInNewTab(message.mediaUrl!, fileType);
                      }}
                    >
                      Download
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(message.createdAt), 'h:mm a')}
                </span>
                {isMe && message.status && (
                  <span className="text-[10px] text-muted-foreground">
                    {message.status === 'read' || message.status === 'delivered' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Pending (uploading / failed) bubble — always at bottom ── */}
      {pendingMedia && (
        <div className="flex w-full justify-end">
          <div className="max-w-[60%] flex flex-col items-end gap-2">
            <div className="rounded-2xl rounded-br-sm bg-[linear-gradient(135deg,hsl(238_75%_58%)_0%,hsl(258_75%_58%)_100%)] px-3 py-2 text-primary-foreground">
              {pendingMedia.fileType.startsWith('image/') && pendingMedia.previewUrl ? (
                <img
                  src={pendingMedia.previewUrl}
                  alt={pendingMedia.fileName}
                  className="max-h-48 rounded-lg object-cover"
                />
              ) : pendingMedia.fileType.startsWith('video/') ? (
                <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-3">
                  <VideoIcon className="h-5 w-5" />
                  <span className="text-sm truncate max-w-[160px]">{pendingMedia.fileName}</span>
                </div>
              ) : pendingMedia.fileType.startsWith('audio/') ? (
                <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-3">
                  <Music className="h-5 w-5" />
                  <span className="text-sm truncate max-w-[160px]">{pendingMedia.fileName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-3">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm truncate max-w-[160px]">{pendingMedia.fileName}</span>
                </div>
              )}

              <div className="mt-2 text-xs flex items-center gap-1">
                {pendingMedia.status === 'uploading' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Upload failed.</span>
                    {onRetryUpload && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 underline"
                        onClick={onRetryUpload}
                      >
                        <RefreshCcw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(pendingMedia.createdAt), 'h:mm a')}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="fixed bottom-24 right-8 h-10 w-10 rounded-full shadow-lg z-10"
          variant="secondary"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
