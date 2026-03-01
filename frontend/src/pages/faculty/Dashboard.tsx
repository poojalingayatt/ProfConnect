import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { getAppointments, acceptAppointment, rejectAppointment } from '@/api/appointments';
import { facultyApi } from '@/api/faculty';

const DURATION_OPTIONS = [30, 45, 60, 90];

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Accept modal state
  const [acceptModal, setAcceptModal] = useState<{ open: boolean; appointmentId: number | null }>({ open: false, appointmentId: null });
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ open: boolean; appointmentId: number | null }>({ open: false, appointmentId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  // ── Fetch real appointments ──
  const { data: allAppointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    enabled: !!user,
  });

  // ── Fetch real follower count ──
  const { data: followers = [] } = useQuery({
    queryKey: ['myFollowers'],
    queryFn: facultyApi.getMyFollowers,
    enabled: !!user,
  });

  const now = new Date();
  const pendingAppointments = allAppointments.filter((a: any) => a.status === 'PENDING');
  const upcomingAppointments = allAppointments.filter(
    (a: any) => a.status === 'ACCEPTED' && new Date(a.date) >= now
  );
  const completedCount = allAppointments.filter(
    (a: any) => a.status === 'COMPLETED'
  ).length;
  const followerCount = Array.isArray(followers) ? followers.length : 0;

  const todayStr = now.toISOString().split('T')[0];
  const todayAppointments = allAppointments.filter(
    (a: any) => a.date?.startsWith(todayStr) && (a.status === 'ACCEPTED' || a.status === 'PENDING')
  );

  // ── Accept Mutation ──
  const acceptMutation = useMutation({
    mutationFn: acceptAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ description: 'Appointment accepted. Student notified.' });
      setAcceptModal({ open: false, appointmentId: null });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        description: error?.response?.data?.message || 'Failed to accept appointment',
      });
    },
  });

  // ── Reject Mutation ──
  const rejectMutation = useMutation({
    mutationFn: rejectAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ description: 'Appointment rejected. Student notified.' });
      setRejectModal({ open: false, appointmentId: null });
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        description: error?.response?.data?.message || 'Failed to reject appointment',
      });
    },
  });

  const handleOpenAcceptModal = (appointmentId: number) => {
    setSelectedDuration(30);
    setCustomDuration('');
    setUseCustomDuration(false);
    setAcceptModal({ open: true, appointmentId });
  };

  const handleConfirmAccept = () => {
    if (!acceptModal.appointmentId) return;
    const duration = useCustomDuration ? parseInt(customDuration) : selectedDuration;
    if (!duration || duration < 15 || duration > 180) {
      toast({ description: 'Duration must be between 15 and 180 minutes', variant: 'destructive' });
      return;
    }
    acceptMutation.mutate({ id: acceptModal.appointmentId, duration });
  };

  const handleOpenRejectModal = (appointmentId: number) => {
    setRejectionReason('');
    setRejectModal({ open: true, appointmentId });
  };

  const handleConfirmReject = () => {
    if (!rejectModal.appointmentId) return;
    if (!rejectionReason.trim()) {
      toast({ description: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }
    rejectMutation.mutate({ id: rejectModal.appointmentId, reason: rejectionReason.trim() });
  };

  const getStudentInfo = (appointment: any) => {
    if (appointment.student?.name) {
      return {
        name: appointment.student.name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${appointment.student.name}`
      };
    }
    return {
      name: `Student ${appointment.studentId}`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Student${appointment.studentId}`
    };
  };

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
                    {pendingAppointments.slice(0, 4).map((appointment: any) => {
                      const student = getStudentInfo(appointment);
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-4 p-4 rounded-xl bg-warning/5 border border-warning/20"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{student.name}</p>
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
                                {appointment.slot || appointment.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleOpenAcceptModal(appointment.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRejectModal(appointment.id)}
                            >
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
                    {todayAppointments.map((appointment: any) => {
                      const student = getStudentInfo(appointment);
                      return (
                        <div key={appointment.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                          <div className="w-1 h-12 bg-primary rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {appointment.slot || appointment.time}
                              {appointment.duration ? ` (${appointment.duration} min)` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.name}</p>
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

      {/* ═══ Accept Modal (Duration Selector) ═══ */}
      <Dialog open={acceptModal.open} onOpenChange={(open) => { if (!open) setAcceptModal({ open: false, appointmentId: null }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Appointment</DialogTitle>
            <DialogDescription>Select the meeting duration for this appointment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Label>Duration (minutes)</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => { setSelectedDuration(d); setUseCustomDuration(false); }}
                  className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${!useCustomDuration && selectedDuration === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-accent border-border'
                    }`}
                >
                  {d} min
                </button>
              ))}
              <button
                onClick={() => setUseCustomDuration(true)}
                className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${useCustomDuration
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card hover:bg-accent border-border'
                  }`}
              >
                Custom
              </button>
            </div>

            {useCustomDuration && (
              <div>
                <Input
                  type="number"
                  min={15}
                  max={180}
                  placeholder="e.g., 75"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">15–180 minutes</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setAcceptModal({ open: false, appointmentId: null })}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmAccept}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? 'Accepting...' : 'Confirm Accept'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Reject Modal (Reason Textarea) ═══ */}
      <Dialog open={rejectModal.open} onOpenChange={(open) => { if (!open) { setRejectModal({ open: false, appointmentId: null }); setRejectionReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Appointment</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this appointment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="dashboard-rejection-reason">Reason</Label>
              <Textarea
                id="dashboard-rejection-reason"
                placeholder="e.g., I am unavailable that day."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { setRejectModal({ open: false, appointmentId: null }); setRejectionReason(''); }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
