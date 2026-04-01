import { api } from '@/lib/api';

export type Conversation = {
  id: number;
  isApproved: boolean;
  user: {
    id: number;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  bytes?: number | null;
  appointmentId?: number | null;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
};

export type PendingMediaMessage = {
  id: string;
  conversationId: number;
  senderId: number;
  fileName: string;
  fileType: string;
  previewUrl?: string;
  status: 'uploading' | 'failed';
  error?: string;
  createdAt: string;
};

export const startDirectChat = async (facultyId: number) => {
  const response = await api.post(`/chat/start/${facultyId}`);
  return response.data.data.conversation;
};

export const approveChat = async (id: number) => {
  const response = await api.patch(`/chat/${id}/approve`);
  return response.data.data.conversation;
};

export const rejectChat = async (id: number) => {
  const response = await api.patch(`/chat/${id}/reject`);
  return response.data;
};

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get('/chat/conversations');
  return response.data.data;
};

export const getMessages = async (conversationId: number): Promise<Message[]> => {
  const response = await api.get(`/chat/${conversationId}/messages`);
  return response.data.data;
};

export const sendMessage = async (data: {
  conversationId: number;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  bytes?: number;
}): Promise<Message> => {
  // Client-side guard: reject empty messages before sending
  const hasText = data.content && data.content.trim().length > 0;
  const hasMedia = Boolean(data.mediaUrl);
  if (!hasText && !hasMedia) {
    throw new Error('Message must have content or a media attachment');
  }

  const response = await api.post(`/chat/${data.conversationId}/messages`, {
    content: data.content,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType,
    bytes: data.bytes,
  });
  return response.data.data;
};

export const markRead = async (conversationId: number): Promise<void> => {
  await api.patch(`/chat/${conversationId}/read`);
};
