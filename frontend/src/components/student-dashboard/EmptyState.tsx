import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center h-full flex flex-col items-center justify-center">
      <CardContent className="p-0 flex flex-col items-center justify-center">
        {icon && <div className="mb-4 opacity-50">{icon}</div>}
        <p className="font-semibold text-slate-500">{message}</p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
