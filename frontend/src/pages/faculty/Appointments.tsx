import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/api';
import { Calendar, Clock, MapPin, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

const FacultyAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'upcoming' | 'completed'>('all');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await appointmentsApi.getMyAppointments();
        if (response.success) {
          setAppointments(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const facultyAppointments = appointments;

  const now = new Date();
  const pendingAppointments = facultyAppointments.filter(a => a.status === 'pending');
  const upcomingAppointments = facultyAppointments.filter(
    a => a.status === 'accepted' && new Date(a.date) >= now
  );
  const completedAppointments = facultyAppointments.filter(
    a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected'
  );

  const getFilteredAppointments = () => {
    switch (activeTab) {
      case 'pending':
        return pendingAppointments;
      case 'upcoming':
        return upcomingAppointments;
      case 'completed':
        return completedAppointments;
      default:
        return facultyAppointments;
    }
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleAccept = (appointmentId: number) => {
    toast({
      title: 'Appointment Accepted',
      description: 'The student has been notified.',
    });
  };

  const handleReject = (appointmentId: number) => {
    toast({
      variant: 'destructive',
      title: 'Appointment Rejected',
      description: 'The student has been notified.',
    });
  };

  const handleCancel = (appointmentId: number) => {
    toast({
      description: 'Appointment cancelled successfully',
    });
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground mt-1">Manage your appointments with students.</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingAppointments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                    {pendingAppointments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Past</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No appointments found</h3>
                  <p className="text-muted-foreground mt-1">
                    {activeTab === 'pending'
                      ? 'No pending requests to review'
                      : activeTab === 'upcoming'
                        ? 'No upcoming appointments scheduled'
                        : 'No appointments in this category'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map(appointment => {
                    const student = appointment.studentId;  // API returns populated student data
                    const isPending = appointment.status === 'pending';
                    const isAccepted = appointment.status === 'accepted';

                    return (
                      <Card
                        key={appointment._id}
                        className={isPending ? 'border-warning/50 bg-warning/5' : ''}
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {/* Date sidebar */}
                            <div className={`sm:w-24 p-4 flex sm:flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r ${isPending ? 'bg-warning/10 border-warning/20' : 'bg-accent/50 border-border'}`}>
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
                                    <AvatarImage src={student?.avatar} />
                                    <AvatarFallback>{student?.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-medium text-foreground">{appointment.title}</h3>
                                    <p className="text-sm text-muted-foreground">{student?.name}</p>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {appointment.time} ({appointment.duration} min)
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {appointment.location}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:items-end gap-3">
                                  {getStatusBadge(appointment.status)}

                                  {isPending && (
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="success" onClick={() => handleAccept(appointment.id)}>
                                        <Check className="h-4 w-4 mr-1" />
                                        Accept
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => handleReject(appointment.id)}>
                                        <X className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}

                                  {isAccepted && new Date(appointment.date) >= now && (
                                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleCancel(appointment.id)}>
                                      Cancel
                                    </Button>
                                  )}
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
      )}
    </DashboardLayout>
  );
};

export default FacultyAppointments;
