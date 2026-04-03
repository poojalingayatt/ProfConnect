import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
import { getConversations } from '@/api/chat';
import { facultyApi } from '@/api/faculty';

// Import new modular components
import HeaderGreeting from '@/components/faculty-dashboard/HeaderGreeting';
import ProfileCard from '@/components/faculty-dashboard/ProfileCard';
import StatsCard from '@/components/faculty-dashboard/StatsCard';
import PendingRequestsList from '@/components/faculty-dashboard/PendingRequestsList';
import ScheduleTimeline from '@/components/faculty-dashboard/ScheduleTimeline';
import AvailabilitySelector from '@/components/faculty-dashboard/AvailabilitySelector';
import AnnouncementsSection from '@/components/faculty-dashboard/AnnouncementsSection';

const DURATION_OPTIONS = [30, 45, 60, 90];

const FacultyDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // New UI state
  const [isInOffice, setIsInOffice] = useState(true);

  // Accept modal state
  const [acceptModal, setAcceptModal] = useState<{ open: boolean; appointmentId: number | null }>({ open: false, appointmentId: null });
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ open: boolean; appointmentId: number | null }>({ open: false, appointmentId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  // ── Fetch real appointments ──
  const { data: allAppointments = [], isLoading: apptsLoading } = useQuery({
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

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: !!user,
  });

  const isLoading = authLoading || apptsLoading;

  const now = new Date();
  const pendingAppointments = allAppointments.filter((a: any) => a.status === 'PENDING');
  const upcomingAppointments = allAppointments.filter(
    (a: any) => a.status === 'ACCEPTED' && new Date(a.date) >= now
  );
  
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
            <div className="text-slate-400 font-medium">Loading Dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const office = (user as any)?.office || "Office not set";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
        
        {/* Header Section */}
        <HeaderGreeting 
          name={user?.name?.split('.')[1]?.trim() || user?.name || ''}
          pendingRequests={pendingAppointments.length}
          appointmentsCount={todayAppointments.length}
          isInOffice={isInOffice}
          onToggleOfficeOptions={setIsInOffice}
        />

        {/* Main Grid Layout: Left 2 Cols, Right 1 Col */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Profile */}
            <ProfileCard 
              name={user?.name?.split('.')[1]?.trim() || user?.name || ''}
              role={user?.role || 'FACULTY'}
              department={user?.department || 'Department not set'}
              office={office}
              avatar={user?.avatar}
              tags={['AI Ethics', 'Neural Networks', 'Machine Learning']}
              onEditProfile={() => navigate('/faculty/settings')}
            />

            {/* Pending Requests */}
            <PendingRequestsList 
              requests={pendingAppointments}
              onAccept={handleOpenAcceptModal}
              onReject={handleOpenRejectModal}
              onViewAll={() => navigate('/faculty/appointments')}
            />

            {/* Availability Management */}
            <AvailabilitySelector 
              onAddSlot={() => navigate('/faculty/availability')}
              onBlockBreak={() => navigate('/faculty/availability')}
            />
            
            {/* Announcements */}
            <AnnouncementsSection />

          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Stats Cards stack */}
            <div className="flex flex-col gap-4">
              <StatsCard 
                title="Pending Requests" 
                value={pendingAppointments.length} 
                textColor="text-blue-600"
                onClick={() => navigate('/faculty/appointments')}
              />
              <StatsCard 
                title="Upcoming Today" 
                value={todayAppointments.length} 
                onClick={() => navigate('/faculty/appointments')}
              />
              <StatsCard 
                title="Followers" 
                value={followerCount} 
                onClick={() => navigate('/faculty/followers')}
              />
            </div>

            <ScheduleTimeline appointments={todayAppointments} />
          </div>

        </div>
      </div>

      {/* ═══ Accept Modal (Duration Selector) ═══ */}
      <Dialog open={acceptModal.open} onOpenChange={(open) => { if (!open) setAcceptModal({ open: false, appointmentId: null }); }}>
        <DialogContent className="max-w-md rounded-2xl">
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
                  className={`px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-semibold ${!useCustomDuration && selectedDuration === d
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                >
                  {d} min
                </button>
              ))}
              <button
                onClick={() => setUseCustomDuration(true)}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-semibold ${useCustomDuration
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
              >
                Custom
              </button>
            </div>

            {useCustomDuration && (
              <div className="animate-fade-in">
                <Input
                  type="number"
                  min={15}
                  max={180}
                  className="rounded-xl border-slate-200 focus-visible:ring-blue-600 mt-2"
                  placeholder="e.g., 75"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
                <p className="text-xs text-slate-500 font-medium mt-1.5 ml-1">15–180 minutes</p>
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button variant="outline" className="rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setAcceptModal({ open: false, appointmentId: null })}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Appointment</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this appointment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="dashboard-rejection-reason" className="font-semibold text-slate-700 mb-2 block">Reason</Label>
              <Textarea
                id="dashboard-rejection-reason"
                className="rounded-xl border-slate-200 focus-visible:ring-rose-500 resize-none"
                placeholder="e.g., I am unavailable that day."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="outline" className="rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => { setRejectModal({ open: false, appointmentId: null }); setRejectionReason(''); }}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all"
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
