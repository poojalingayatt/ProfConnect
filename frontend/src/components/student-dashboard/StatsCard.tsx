import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => {
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center gap-2">
      <CardContent className="p-0">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-4xl font-black text-slate-900 mt-2">{value}</p>
      </CardContent>
    </Card>
  );
};
