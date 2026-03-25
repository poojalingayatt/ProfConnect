import React from 'react';
import ChatPage from '@/pages/chat/ChatPage';
import DashboardLayout from '@/components/Layout/DashboardLayout';

const StudentChat: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        </div>
        <ChatPage />
      </div>
    </DashboardLayout>
  );
};

export default StudentChat;
