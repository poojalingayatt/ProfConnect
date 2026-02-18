import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import RescheduleModal from '@/components/modals/RescheduleModal';
import AddNotesModal from '@/components/modals/AddNotesModal';
import { useToast } from '@/hooks/use-toast';
import { getAppointments, cancelAppointment } from '@/api/appointments';

type AppointmentStatus = 'accepted' | 'pending' | 'completed' | 'cancelled' | 'rejected';

type Appointment = {
  id: number;
  studentId: number;
  facultyId: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  status: AppointmentStatus;
  location?: string;
};

const StudentAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [notesModal, setNotesModal] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });

  const {
    data: studentAppointments = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments
  });

  const now = new Date();
  const upcomingAppointments = studentAppointments.filter(
    a => new Date(a.date) >= now && (a.status === 'ACCEPTED' || a.status === 'PENDING')
  );
  const pastAppointments = studentAppointments.filter(
    a => new Date(a.date) < now || a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED'
  );

  const statusMap: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    RESCHEDULE_REQUESTED: 'Reschedule Requested'
  };

  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        description: 'Appointment cancelled',
      });
    },
    onError: () => {
      toast({
        description: 'Failed to cancel appointment',
        variant: 'destructive',
      });
    }
  });
  const getFilteredAppointments = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingAppointments;
      case 'past':
        return pastAppointments;
      default:
        return studentAppointments;
    }
  };

  // Faculty info now comes from backend appointment.faculty.name
  const getFacultyInfo = (appointment: any) => {
    if (appointment.faculty?.name) {
      return {
        name: appointment.faculty.name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${appointment.faculty.name}`
      };
    }
    // Fallback if backend data missing
    return {
      name: `Faculty ${appointment.facultyId}`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Faculty${appointment.facultyId}`
    };
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const styles: Record<AppointmentStatus, string> = {
      accepted: 'bg-success/10 text-success border-success/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      completed: 'bg-muted text-muted-foreground border-muted',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    return (
      <Badge className={styles[status]}>
        {statusMap[status.toUpperCase()] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleCancel = (appointmentId: number) => {
    cancelMutation.mutate(appointmentId);
  };

  const handleReschedule = (newDate: string, newTime: string, reason: string) => {
    toast({
      title: 'Reschedule Requested',
      description: `New time: ${new Date(newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${newTime}`,
    });
    setRescheduleModal({ open: false, appointment: null });
  };

  const handleSaveNotes = (notes: string) => {
    toast({
      description: 'Notes saved successfully',
    });
    setNotesModal({ open: false, appointment: null });
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Appointments</h1>
          <p className="text-muted-foreground mt-1">View and manage your appointments.</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">
              All ({studentAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load appointments.</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No appointments found</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === 'upcoming'
                    ? 'You have no upcoming appointments'
                    : activeTab === 'past'
                    ? 'You have no past appointments'
                    : 'You haven\'t booked any appointments yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map(appointment => {
                  const facultyMember = getFacultyInfo(appointment);
                  const isPast = new Date(appointment.date) < now;
                  const isCompleted = appointment.status === 'COMPLETED';
                
                  return (
                    <Card key={appointment.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Date sidebar */}
                          <div className="sm:w-24 bg-accent/50 p-4 flex sm:flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-border">
                            <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                              {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className="text-2xl font-bold text-foreground mx-2 sm:mx-0">
                              {new Date(appointment.date).getDate()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                          </div>
                
                          {/* Main content */}
                          <div className="flex-1 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12 hidden sm:flex">
                                  <AvatarImage src={facultyMember?.avatar} />
                                  <AvatarFallback>{facultyMember?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium text-foreground">{appointment.title}</h3>
                                  <p className="text-sm text-muted-foreground">{facultyMember?.name}</p>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {appointment.slot || appointment.time} ({appointment.duration || 60} min)
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {appointment.location || 'Online'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:items-end gap-3">
                                {getStatusBadge(appointment.status)}
                                
                                <div className="flex flex-wrap gap-2">
                                  {!isPast && (appointment.status === 'ACCEPTED' || appointment.status === 'PENDING') && (
                                    <>
                                      {appointment.status === 'ACCEPTED' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => setRescheduleModal({ open: true, appointment })}
                                        >
                                          Reschedule
                                        </Button>
                                      )}
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-destructive" 
                                        onClick={() => handleCancel(appointment.id)}
                                        disabled={cancelMutation.isPending}
                                      >
                                        {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                                      </Button>
                                    </>
                                  )}
                                  
                                  {(isCompleted || isPast) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setNotesModal({ open: true, appointment })}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      {isCompleted ? 'View Notes' : 'Add Notes'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {appointment.description && (
                              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                                {appointment.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal.appointment && (
        <RescheduleModal
          open={rescheduleModal.open}
          onOpenChange={(open) => setRescheduleModal({ open, appointment: open ? rescheduleModal.appointment : null })}
          appointmentTitle={rescheduleModal.appointment.title}
          currentDate={rescheduleModal.appointment.date}
          currentTime={rescheduleModal.appointment.time}
          onConfirm={handleReschedule}
        />
      )}

      {/* Add Notes Modal */}
      {notesModal.appointment && (
        <AddNotesModal
          open={notesModal.open}
          onOpenChange={(open) => setNotesModal({ open, appointment: open ? notesModal.appointment : null })}
          appointmentTitle={notesModal.appointment.title}
          onSave={handleSaveNotes}
        />
      )}
    </DashboardLayout>
  );
};

export default StudentAppointments;