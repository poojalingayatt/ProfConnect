import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderSectionProps {
  studentName: string;
  upcomingCount: number;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ studentName, upcomingCount }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back, {studentName}
        </h1>
        <p className="text-blue-600 mt-2 font-medium">
          You have {upcomingCount} upcoming appointments this week.
        </p>
      </div>

      <Button 
        onClick={() => navigate('/student/faculty')}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 px-6 py-5 font-semibold shrink-0"
      >
        <Plus className="mr-2 h-5 w-5" />
        Book New Appointment
      </Button>
    </div>
  );
};

export default HeaderSection;
