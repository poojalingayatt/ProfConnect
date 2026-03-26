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
  senderId: number;
  content: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
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

export const sendMessage = async (data: { conversationId: number, content: string }): Promise<Message> => {
  const response = await api.post(`/chat/${data.conversationId}/messages`, { content: data.content });
  return response.data.data;
};
