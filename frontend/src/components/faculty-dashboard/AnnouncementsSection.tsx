import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';

const AnnouncementsSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 mt-8">
        <h3 className="text-xl font-bold text-slate-900">Announcements</h3>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-none">
          <Megaphone className="mr-2 h-4 w-4" /> Post New
        </Button>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            <div className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-900">Midterm Exam Schedule</h4>
                <span className="text-xs font-semibold text-slate-400">2h ago</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">The midterm exam for CS302 will be held next Friday in the main hall...</p>
            </div>
            
            <div className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-900">Office Hours Change</h4>
                <span className="text-xs font-semibold text-slate-400">Yesterday</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Please note that Wednesday office hours are moved to 4 PM...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsSection;
