import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from './EmptyState';

interface UpcomingAppointmentsProps {
  appointments: any[];
  onCancel: (id: number) => void;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ appointments, onCancel }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    if (status === 'ACCEPTED') {
      return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-1 rounded tracking-wider uppercase">CONFIRMED</span>;
    }
    if (status === 'PENDING') {
      return <span className="bg-amber-100 text-amber-700 text-[10px] font-extrabold px-2 py-1 rounded tracking-wider uppercase">PENDING</span>;
    }
    return <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-1 rounded tracking-wider uppercase">{status}</span>;
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-slate-900">Upcoming</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/student/appointments')}
          className="text-blue-600 font-bold hover:bg-blue-50 transition-colors tracking-wide"
        >
          See All
        </Button>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <EmptyState message="No upcoming appointments." icon={<Clock className="h-8 w-8 text-slate-400" />} />
        ) : (
          appointments.slice(0, 3).map((appointment) => {
            const facultyName = appointment.faculty?.name || `Faculty ${appointment.facultyId}`;
            const title = appointment.title || 'Meeting';
            const timeStr = appointment.slot || appointment.time;
            
            const apptDate = new Date(appointment.date);
            const isToday = apptDate.toDateString() === now.toDateString();
            
            // Just a basic check to optionally show/hide join call button
            // If the time is within range would be more complex, we'll keep it strict by `isToday`
            const canJoinCall = isToday && appointment.status === 'ACCEPTED';

            return (
              <Card key={appointment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                <CardContent className="p-0">
                  <div className={`h-1.5 w-full ${appointment.status === 'ACCEPTED' ? 'bg-blue-600' : 'bg-amber-500'}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg leading-tight">{facultyName}</h4>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 mb-5 text-sm font-bold text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{isToday ? 'Today' : apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {timeStr}</span>
                    </div>

                    <div className="flex gap-3">
                      {canJoinCall ? (
                        <Button 
                          className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
                        >
                          Join Call
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          className="flex-1 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 pointer-events-none opacity-50"
                        >
                          View Details
                        </Button>
                      )}

                      {appointment.status === 'ACCEPTED' ? (
                        <Button 
                          variant="outline"
                          title="Coming soon"
                          className="flex-1 rounded-xl border-slate-200 text-slate-700 font-bold opacity-50 cursor-not-allowed hover:bg-transparent"
                        >
                          Reschedule
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => onCancel(appointment.id)}
                          className="flex-1 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
