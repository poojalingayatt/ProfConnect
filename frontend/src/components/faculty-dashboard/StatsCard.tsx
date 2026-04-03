import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  textColor?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  textColor = 'text-slate-900',
  onClick,
}) => {
  return (
    <Card 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200 hover:-translate-y-0.5 transition-transform' : ''
      }`}
    >
      <CardContent className="p-0 space-y-3">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className={`text-4xl font-black ${textColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
