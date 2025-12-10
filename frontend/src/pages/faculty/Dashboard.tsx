import { useAuth } from '@/context/AuthContext';
import { appointments } from '@/data/appointments';
import { students } from '@/data/users';
import { Calendar, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const FacultyDashboard = () => {
  const { user, getFacultyData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const facultyData = getFacultyData();

  // Get faculty's appointments
  const facultyAppointments = appointments.filter(a => a.facultyId === user?.id);
  const pendingAppointments = facultyAppointments.filter(a => a.status === 'pending');
  const upcomingAppointments = facultyAppointments.filter(
    a => a.status === 'accepted' && new Date(a.date) >= new Date()
  );
  const completedCount = facultyAppointments.filter(a => a.status === 'completed').length;

  // Get follower count
  const followerCount = facultyData?.followerCount || 0;

  const getStudentInfo = (studentId: number) => {
    return students.find(s => s.id === studentId);
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

  // Today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = facultyAppointments.filter(
    a => a.date === today && a.status === 'accepted'
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split('.')[1]?.trim() || user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Manage your appointments and availability.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-lift cursor-pointer border-warning/50 bg-warning/5" onClick={() => navigate('/faculty/appointments')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">{pendingAppointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer" onClick={() => navigate('/faculty/appointments')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer" onClick={() => navigate('/faculty/followers')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Followers</p>
                  <p className="text-2xl font-bold text-foreground">{followerCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending Requests */}
          <div className="lg:col-span-2">
            <Card className={pendingAppointments.length > 0 ? 'border-warning/50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Pending Requests
                  {pendingAppointments.length > 0 && (
                    <Badge className="bg-warning text-warning-foreground">{pendingAppointments.length}</Badge>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/faculty/appointments')}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-success/50 mb-3" />
                    <p className="text-muted-foreground">No pending requests</p>
                    <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAppointments.slice(0, 4).map(appointment => {
                      const student = getStudentInfo(appointment.studentId);
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-4 p-4 rounded-xl bg-warning/5 border border-warning/20"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student?.avatar} />
                            <AvatarFallback>{student?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{student?.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{appointment.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(appointment.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appointment.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="success" onClick={() => handleAccept(appointment.id)}>
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(appointment.id)}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No appointments today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map(appointment => {
                      const student = getStudentInfo(appointment.studentId);
                      return (
                        <div key={appointment.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                          <div className="w-1 h-12 bg-primary rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{appointment.time}</p>
                            <p className="text-xs text-muted-foreground">{student?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{appointment.title}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/faculty/availability')}>
                  <Clock className="mr-2 h-4 w-4" />
                  Manage Availability
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/faculty/appointments')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View All Appointments
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/faculty/settings')}>
                  <Users className="mr-2 h-4 w-4" />
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
