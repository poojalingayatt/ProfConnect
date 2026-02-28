import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Heart, CheckCircle, ArrowRight, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { getAppointments } from '@/api/appointments';
import { facultyApi } from '@/api/faculty';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Fetch real appointments ──
  const { data: studentAppointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    enabled: !!user,
  });

  // ── Fetch followed faculty ──
  const { data: followedFaculty = [] } = useQuery({
    queryKey: ['followedFacultyIds'],
    queryFn: facultyApi.getMyFollowedIds,
    enabled: !!user,
  });

  const now = new Date();
  const upcomingAppointments = studentAppointments.filter(
    (a: any) => new Date(a.date) >= now && (a.status === 'ACCEPTED' || a.status === 'PENDING')
  );
  const pendingAppointments = studentAppointments.filter(
    (a: any) => a.status === 'PENDING'
  );
  const completedCount = studentAppointments.filter(
    (a: any) => a.status === 'COMPLETED'
  ).length;

  const followedFacultyCount = followedFaculty.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge className="bg-success/10 text-success border-success/20">Accepted</Badge>;
      case 'PENDING':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-muted text-muted-foreground">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFacultyInfo = (appointment: any) => {
    if (appointment.faculty?.name) {
      return {
        name: appointment.faculty.name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${appointment.faculty.name}`
      };
    }
    return {
      name: `Faculty ${appointment.facultyId}`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Faculty${appointment.facultyId}`
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your appointments.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-lift cursor-pointer" onClick={() => navigate('/student/appointments')}>
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

          <Card className="hover-lift cursor-pointer" onClick={() => navigate('/student/appointments')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{pendingAppointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer" onClick={() => navigate('/student/followed')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Following</p>
                  <p className="text-2xl font-bold text-foreground">{followedFacultyCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-destructive" />
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
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/student/appointments')}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/student/faculty')}>
                      Book an Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appointment: any) => {
                      const facultyMember = getFacultyInfo(appointment);
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={facultyMember.avatar} />
                            <AvatarFallback>{facultyMember.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{appointment.title}</p>
                            <p className="text-sm text-muted-foreground">{facultyMember.name}</p>
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
                                {appointment.slot || appointment.time}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Search */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Search</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => navigate('/student/faculty')}
                >
                  Search faculty by name or department...
                </Button>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Computer Science', 'Electronics', 'Mechanical'].map(dept => (
                    <Badge
                      key={dept}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => navigate('/student/faculty')}
                    >
                      {dept}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
