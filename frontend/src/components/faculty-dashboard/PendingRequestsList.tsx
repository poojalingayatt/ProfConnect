import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, X } from 'lucide-react';

interface PendingRequestsListProps {
  requests: any[];
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onViewAll: () => void;
}

const PendingRequestsList: React.FC<PendingRequestsListProps> = ({
  requests,
  onAccept,
  onReject,
  onViewAll,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-slate-900">Pending Requests</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewAll}
          className="text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
        >
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
           <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
             <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-3 opacity-60" />
             <p className="font-semibold text-slate-700">No pending requests</p>
             <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
           </Card>
        ) : (
          requests.slice(0, 4).map((request) => {
            const studentName = request.student?.name || `Student ${request.studentId}`;
            const avatarUrl = request.student?.name 
              ? `https://api.dicebear.com/7.x/initials/svg?seed=${request.student.name}`
              : `https://api.dicebear.com/7.x/initials/svg?seed=Student${request.studentId}`;
            
            const timeInfo = request.slot || request.time || 'Time TBD';

            return (
              <Card key={request.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12 rounded-full border border-gray-100 bg-indigo-50 text-indigo-600">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="font-semibold bg-indigo-100 text-indigo-700">{studentName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{studentName}</p>
                      <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                        <span className="text-slate-600">{request.title || 'Meeting Request'}</span> • {timeInfo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-auto">
                    <Button
                      size="sm"
                      onClick={() => onAccept(request.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-xl transition-all duration-200"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-slate-600 border-slate-200 rounded-xl font-semibold opacity-60 cursor-not-allowed hover:bg-transparent"
                      title="Coming soon"
                    >
                      Reschedule
                    </Button>
                    <button
                      onClick={() => onReject(request.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      title="Reject"
                    >
                      <X className="h-5 w-5" />
                    </button>
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

export default PendingRequestsList;
