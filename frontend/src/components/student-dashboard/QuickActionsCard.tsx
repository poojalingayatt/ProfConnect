import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'CALENDAR',
      icon: <Calendar className="h-6 w-6" />,
      onClick: () => navigate('/student/appointments'),
    },
    {
      label: 'FACULTY',
      icon: <Users className="h-6 w-6" />,
      onClick: () => navigate('/student/faculty'),
    },
    {
      label: 'MESSAGES',
      icon: <MessageSquare className="h-6 w-6" />,
      onClick: () => navigate('/student/chat'),
    },
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
      <CardContent className="p-0 flex items-center justify-around w-full gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="flex flex-col items-center justify-center gap-2 w-full hover:-translate-y-1 transition-transform group"
          >
            <div className="h-12 w-12 rounded-full bg-indigo-50/80 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              {action.icon}
            </div>
            <span className="text-[10px] font-[800] text-slate-800 tracking-wider">
              {action.label}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
