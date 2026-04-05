import React from 'react';
import ChatPage from '@/pages/chat/ChatPage';
import DashboardLayout from '@/components/Layout/DashboardLayout';

const StudentChat: React.FC = () => {
  return (
    <DashboardLayout disableContentPadding disableMainScroll contentClassName="h-[calc(100dvh-4rem)]">
      <div className="h-full">
        <ChatPage />
      </div>
    </DashboardLayout>
  );
};

export default StudentChat;
