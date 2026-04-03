import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';

// API
import { getAppointments, cancelAppointment } from '@/api/appointments';
import { facultyApi } from '@/api/faculty';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';

// New Presentational Components
import HeaderSection from '@/components/student-dashboard/HeaderSection';
import StatsCards from '@/components/student-dashboard/StatsCards';
import QuickActionsCard from '@/components/student-dashboard/QuickActionsCard';
import FacultySearch from '@/components/student-dashboard/FacultySearch';
import UpcomingAppointments from '@/components/student-dashboard/UpcomingAppointments';
import AnnouncementList from '@/components/student-dashboard/AnnouncementList';
import SkeletonLoader from '@/components/student-dashboard/SkeletonLoader';

const StudentDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Faculty Search State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // ── Fetch Appointments ──
  const { data: studentAppointments = [], isLoading: apptsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    enabled: !!user,
  });

  // ── Fetch Followed Faculty IDs ──
  const { data: followedFaculty = [], isLoading: followersLoading } = useQuery({
    queryKey: ['followedFacultyIds'],
    queryFn: facultyApi.getMyFollowedIds,
    enabled: !!user,
  });

  // ── Fetch Faculty List (for search) ──
  const filters = useMemo(() => ({
    search: debouncedSearch,
    department: departmentFilter !== 'all' ? departmentFilter : undefined,
  }), [debouncedSearch, departmentFilter]);

  const { data: facultyList = [], isLoading: facultyLoading } = useQuery({
    queryKey: [...queryKeys.facultyList(), filters],
    queryFn: async () => {
      const filterParams: any = {};
      if (filters.search) filterParams.search = filters.search;
      if (filters.department) filterParams.department = filters.department;
      return facultyApi.getFacultyList(filterParams);
    },
    enabled: !!user,
    placeholderData: [],
  });

  // ── Cancel Mutation ──
  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ description: 'Appointment cancelled successfully.' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        description: error?.response?.data?.message || 'Failed to cancel appointment',
      });
    },
  });

  const handleCancelAppointment = (id: number) => {
    cancelMutation.mutate(id);
  };

  const isLoading = authLoading || apptsLoading || followersLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <SkeletonLoader />
      </DashboardLayout>
    );
  }

  // Generate Stats Data
  const now = new Date();
  
  const upcomingAppointments = studentAppointments.filter(
    (a: any) => new Date(a.date) >= now && (a.status === 'ACCEPTED' || a.status === 'PENDING')
  );
  
  const completedCount = studentAppointments.filter(
    (a: any) => a.status === 'COMPLETED'
  ).length;

  // Retrieve unique departments for dropdown
  const allDepartments = ['all', ...new Set(facultyList.map((f: any) => f.department || 'Unknown'))];

  // We are not faking announcements data, using empty array fallback as instructed
  const announcements: any[] = [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
        
        <div className="mb-8">
          <HeaderSection 
            studentName={user?.name?.split(' ')[0] || user?.name || ''} 
            upcomingCount={upcomingAppointments.length} 
          />
        </div>

        {/* LEFT & RIGHT GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* ════ LEFT SIDE ════ */}
          <div className="lg:col-span-2 space-y-6">
            
            <StatsCards 
              upcomingCount={upcomingAppointments.length}
              completedCount={completedCount}
              followedCount={followedFaculty.length}
            />

            <FacultySearch 
              facultyList={facultyList.slice(0, 6)}  // Top 6 limit
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              departments={allDepartments}
              isLoading={facultyLoading}
            />

          </div>

          {/* ════ RIGHT SIDE ════ */}
          <div className="space-y-6">
            
            <QuickActionsCard />

            <UpcomingAppointments 
              appointments={upcomingAppointments}
              onCancel={handleCancelAppointment}
            />

            <AnnouncementList announcements={announcements} />

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
