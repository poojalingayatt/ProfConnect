import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface ScheduleTimelineProps {
  appointments: any[];
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ appointments }) => {
  return (
    <div className="space-y-4 font-sans">
      <h3 className="text-xl font-bold text-slate-900 mb-2">Today's Schedule</h3>

      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <div className="text-center py-10 opacity-70">
              <Calendar className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="font-semibold text-slate-600">No appointments today</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 py-2">
              {appointments.map((appointment) => {
                const studentName = appointment.student?.name || `Student ${appointment.studentId}`;
                const title = appointment.title || 'Meeting';
                const timeStr = appointment.slot || appointment.time;

                return (
                  <div key={appointment.id} className="relative pl-6">
                    {/* Timeline dot */}
                    <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-white border-[3px] border-blue-600 ring-4 ring-white"></span>
                    
                    <p className="text-sm font-bold text-slate-500 mb-1">{timeStr}</p>
                    
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mt-2 transition-all hover:bg-blue-50">
                      <p className="font-bold text-blue-700 text-[15px]">{title}</p>
                      <p className="text-sm font-medium text-blue-600/80 mt-1">Student: {studentName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleTimeline;
