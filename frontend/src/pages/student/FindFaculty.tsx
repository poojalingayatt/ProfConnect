import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { Search, Star, MapPin, Heart, X, Calendar, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '@/components/booking/BookingModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyApi } from '@/api/faculty';
import { Faculty } from '@/types/faculty';
import { getFacultyAvailability } from '@/api/availability';
import { startDirectChat } from '@/api/chat';

const FindFaculty = () => {
  useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Stabilize query key filters
  const filters = useMemo(() => ({
    searchQuery,
    departmentFilter,
    availabilityFilter
  }), [searchQuery, departmentFilter, availabilityFilter]);

  // Query faculty list from backend
  const { data: facultyList = [], isLoading, error } = useQuery<Faculty[]>({
    queryKey: [...queryKeys.facultyList(), filters],
    queryFn: async () => {
      const filterParams: any = {};
      if (searchQuery) filterParams.search = searchQuery;
      if (departmentFilter !== 'all') filterParams.department = departmentFilter;
      if (availabilityFilter === 'online') filterParams.online = true;
      if (availabilityFilter === 'available') filterParams.hasAvailability = true;

      const result = await facultyApi.getFacultyList(filterParams);

      if (!Array.isArray(result)) {
        console.error('API returned non-array data:', result);
        return [];
      }

      return result;
    },
    placeholderData: [],
    retry: 2,
  });

  // Get departments for filter dropdown
  const departments = ['all', ...new Set(facultyList.map(f => f.department || 'Unknown'))];

  const { user } = useAuth();

  // Get user's followed faculty IDs
  const { data: followedIds = [] } = useQuery({
    queryKey: ['followedFacultyIds'],
    queryFn: facultyApi.getMyFollowedIds,
    enabled: !!user,
  });

  const isFollowing = (facultyId: number) => followedIds.includes(facultyId);

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: ({ facultyId, isFollowing }: { facultyId: number; isFollowing: boolean }) => {
      return isFollowing
        ? facultyApi.unfollowFaculty(facultyId)
        : facultyApi.followFaculty(facultyId);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['faculty', 'followed'] });
      const previousFollowed = queryClient.getQueryData<Faculty[]>(queryKeys.facultyFollowed());
      queryClient.setQueryData<Faculty[]>(queryKeys.facultyFollowed(), (oldData) => {
        if (!oldData) return oldData;
        if (variables.isFollowing) {
          return oldData.filter(f => f.id !== variables.facultyId);
        }
        return oldData;
      });
      return { previousFollowed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facultyList() });
      queryClient.invalidateQueries({ queryKey: ['followedFacultyIds'] });
      toast({ description: 'Follow status updated successfully' });
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousFollowed) {
        queryClient.setQueryData(queryKeys.facultyFollowed(), context.previousFollowed);
      }
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update follow status',
        variant: 'destructive'
      });
    }
  });

  const toggleFollow = (facultyId: number) => {
    followMutation.mutate({ facultyId, isFollowing: isFollowing(facultyId) });
  };

  const handleViewProfile = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setProfileModalOpen(true);
  };

  const handleBookFromCard = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setBookingModalOpen(true);
  };

  const handleBookFromModal = () => {
    setProfileModalOpen(false);
    // Small delay to let the profile modal close before opening booking modal
    setTimeout(() => {
      setBookingModalOpen(true);
    }, 150);
  };

  const messageMutation = useMutation({
    mutationFn: startDirectChat,
    onSuccess: (conversation) => {
      navigate(`/student/chat?conversationId=${conversation.id}`);
    },
    onError: (error: any) => {
      toast({
        description: error?.response?.data?.message || 'Failed to start chat',
        variant: 'destructive'
      });
    }
  });

  const handleMessageFaculty = (facultyId: number) => {
    messageMutation.mutate(facultyId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setAvailabilityFilter('all');
  };

  // ─── Faculty Availability for Profile Modal ───
  const { data: modalAvailability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: queryKeys.availability(selectedFaculty?.id ?? 0),
    queryFn: () => getFacultyAvailability(selectedFaculty!.id),
    enabled: !!selectedFaculty?.id && profileModalOpen,
  });

  // Compute weekday slot summary from availability data
  const weekdaySlots = useMemo(() => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayLabels: Record<string, string> = {
      Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
      Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
    };

    return dayOrder
      .map(day => {
        const rule = modalAvailability.find((a: any) => a.day === day);
        return {
          day: dayLabels[day],
          fullDay: day,
          slots: rule ? rule.slots.length : 0,
        };
      })
      .filter(d => d.slots > 0);
  }, [modalAvailability]);

  // Helper to get avatar URL
  const getAvatarUrl = (faculty: Faculty) => {
    if (faculty.avatar) {
      // If avatar is a full URL, use it as-is; otherwise prepend base URL
      if (faculty.avatar.startsWith('http')) return faculty.avatar;
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return `${baseUrl}${faculty.avatar}`;
    }
    return undefined;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Find Faculty</h1>
          <p className="text-muted-foreground mt-1">Search and book appointments with faculty members.</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="faculty-search"
              name="faculty-search"
              placeholder="Search by name, department, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              className="pl-10"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-48" id="department-filter">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-full sm:w-48" id="availability-filter">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online Now</SelectItem>
              <SelectItem value="available">Has Availability</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || departmentFilter !== 'all' || availabilityFilter !== 'all') && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `Showing ${facultyList.length} faculty member${facultyList.length !== 1 ? 's' : ''}`}
        </p>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading faculty: {(error as Error).message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* ═══════════ Faculty Grid ═══════════ */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {facultyList.map(f => (
              <Card key={f.id} className="hover-lift overflow-hidden rounded-2xl shadow-sm border border-border/60">
                <CardContent className="p-0">
                  {/* ── Top Section: Avatar + Info + Heart ── */}
                  <div className="relative p-5 pb-4">
                    {/* Heart / Follow toggle */}
                    <button
                      onClick={() => toggleFollow(f.id)}
                      disabled={followMutation.isPending}
                      className="absolute top-4 right-4 p-1 disabled:opacity-50"
                      aria-label={isFollowing(f.id) ? 'Unfollow' : 'Follow'}
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${isFollowing(f.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground hover:text-red-400'
                          }`}
                      />
                    </button>

                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarImage src={getAvatarUrl(f)} />
                        <AvatarFallback className="text-lg font-semibold bg-muted">
                          {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-foreground truncate">{f.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{f.department}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${f.facultyProfile?.isOnline ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${f.facultyProfile?.isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
                              }`} />
                            {f.facultyProfile?.isOnline ? 'Online' : 'Offline'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-foreground">
                              {f.facultyProfile?.rating?.toFixed(1) ?? '0.0'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Middle Section: Specs + Location ── */}
                  <div className="px-5 pb-4 space-y-3">
                    {/* Specializations */}
                    {f.facultyProfile?.specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {f.facultyProfile.specializations.slice(0, 4).map(spec => (
                          <Badge
                            key={spec.id}
                            variant="outline"
                            className="text-xs font-normal rounded-full px-3 py-0.5 border-border"
                          >
                            {spec.name}
                          </Badge>
                        ))}
                        {f.facultyProfile.specializations.length > 4 && (
                          <Badge variant="outline" className="text-xs font-normal rounded-full px-3 py-0.5 border-border text-muted-foreground">
                            +{f.facultyProfile.specializations.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Office Location */}
                    {(f.officeLocation || f.facultyProfile?.officeLocation) && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{f.officeLocation || f.facultyProfile?.officeLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Bottom Section: Buttons ── */}
                  <div className="px-5 pb-5 flex gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg shrink-0"
                      onClick={() => handleMessageFaculty(f.id)}
                      title="Message Faculty"
                      disabled={messageMutation.isPending}
                    >
                      <MessageCircle className="h-4 w-4 min-w-[16px] text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-lg px-2"
                      onClick={() => handleViewProfile(f)}
                    >
                      Profile
                    </Button>
                    <Button
                      className="flex-1 rounded-lg bg-primary hover:bg-primary/90 px-2"
                      onClick={() => handleBookFromCard(f)}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {facultyList.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No faculty found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* ═══════════ Booking Modal ═══════════ */}
        <BookingModal
          open={bookingModalOpen}
          onClose={() => { setBookingModalOpen(false); setSelectedFaculty(null); }}
          facultyId={selectedFaculty?.id ?? 0}
          facultyName={selectedFaculty?.name ?? ""}
          faculty={selectedFaculty as any}
        />

        {/* ═══════════ View Profile Modal ═══════════ */}
        <Dialog open={profileModalOpen} onOpenChange={(open) => { if (!open) setProfileModalOpen(false); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
            {selectedFaculty && (
              <div>
                {/* ── Header ── */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-2 border-border flex-shrink-0">
                      <AvatarImage src={getAvatarUrl(selectedFaculty)} />
                      <AvatarFallback className="text-2xl font-semibold bg-muted">
                        {selectedFaculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 pt-1">
                      <h2 className="text-xl font-bold text-foreground">{selectedFaculty.name}</h2>
                      <p className="text-sm text-primary font-medium">{selectedFaculty.department}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">
                            {selectedFaculty.facultyProfile?.rating?.toFixed(1) ?? '0.0'}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ({selectedFaculty.facultyProfile?.reviewCount ?? 0} reviews)
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {selectedFaculty.followerCount ?? 0} followers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Content ── */}
                <div className="px-6 space-y-5">
                  {/* About */}
                  {selectedFaculty.facultyProfile?.bio && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-1.5">About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedFaculty.facultyProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Specializations */}
                  {selectedFaculty.facultyProfile?.specializations?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedFaculty.facultyProfile.specializations.map(spec => (
                          <Badge
                            key={spec.id}
                            variant="secondary"
                            className="rounded-full px-3 py-1 text-xs"
                          >
                            {spec.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Office Location */}
                  {(selectedFaculty.officeLocation || selectedFaculty.facultyProfile?.officeLocation) && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-1.5">Office Location</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        {selectedFaculty.officeLocation || selectedFaculty.facultyProfile?.officeLocation}
                      </p>
                    </div>
                  )}

                  {/* Weekly Availability */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Weekly Availability</h4>
                    {availabilityLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      </div>
                    ) : weekdaySlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No availability set.</p>
                    ) : (
                      <div className="grid grid-cols-5 gap-2">
                        {weekdaySlots.map(d => (
                          <div
                            key={d.fullDay}
                            className="text-center p-2.5 rounded-lg bg-accent/50 border border-border/40"
                          >
                            <p className="text-xs font-semibold text-foreground">{d.day}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {d.slots} slot{d.slots !== 1 ? 's' : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Footer Buttons ── */}
                <div className="p-6 pt-5 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-none px-5 rounded-lg"
                    onClick={() => toggleFollow(selectedFaculty.id)}
                    disabled={followMutation.isPending}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFollowing(selectedFaculty.id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                      }`} />
                    {isFollowing(selectedFaculty.id) ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    className="flex-1 rounded-lg bg-primary hover:bg-primary/90"
                    onClick={handleBookFromModal}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FindFaculty;
