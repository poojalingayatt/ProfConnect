import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { Search, Filter, Star, MapPin, Heart, X, Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyApi } from '@/api/faculty';
import { Faculty } from '@/types/faculty';

interface FacultyListItem {
  id: number;
  name: string;
  email: string;
  department?: string;
  facultyProfile: {
    bio?: string;
    rating: number;
    reviewCount: number;
    isOnline: boolean;
    specializations: { id: number; name: string }[];
  };
  officeLocation: string;
  availability: { day: string; slots: string[] }[];
  announcements: { date: string; title: string }[];
  qualifications: string[];
  avatar?: string;
  bio?: string;
  followerCount: number;
  // Access nested properties directly: faculty.facultyProfile.rating
};

// No transformation needed - using backend data directly
// Access nested properties in UI: faculty.facultyProfile.rating

const FindFaculty = () => {
  useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyListItem | null>(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');

  // Stabilize query key filters to prevent unnecessary cache invalidation
  const filters = useMemo(() => ({
    searchQuery,
    departmentFilter,
    availabilityFilter
  }), [searchQuery, departmentFilter, availabilityFilter]);
  
  // Query faculty list from backend
  const { data: facultyListRaw = [], isLoading, error } = useQuery<Faculty[]>({
    queryKey: [...queryKeys.facultyList(), filters],
    queryFn: () => {
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (departmentFilter !== 'all') filters.department = departmentFilter;
      if (availabilityFilter === 'online') filters.online = true;
      if (availabilityFilter === 'available') filters.hasAvailability = true;
      
      return facultyApi.getFacultyList(filters);
    },
    placeholderData: [],
  });
  
  // Use backend data directly - minimal transformation for UI display only
  const facultyList = facultyListRaw.map(faculty => ({
    ...faculty,
    // Only add computed display properties that don't exist in backend
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${faculty.name}`,
    officeLocation: 'Building A, Room 101', // TODO: Replace with actual office location from backend
    availability: [], // TODO: Replace with actual availability from backend
    announcements: [], // TODO: Replace with actual announcements from backend
    qualifications: ['Ph.D. in Computer Science'], // TODO: Replace with actual qualifications from backend
    followerCount: 0, // TODO: Replace with actual follower count from backend
    // Access nested properties directly: faculty.facultyProfile.rating
  }));

  // Get departments for filter dropdown
  const departments = ['all', ...new Set(facultyList.map(f => f.department || 'Unknown'))];
  
  // Function to get follow status - placeholder implementation
  const isFollowing = (facultyId: number) => {
    // This would come from backend, for now using a placeholder
    return false; // TODO: Replace with actual follow status from backend
  };

  // Follow/unfollow mutation with proper optimistic update and rollback
  const followMutation = useMutation({
    mutationFn: ({ facultyId, isFollowing }: { facultyId: number; isFollowing: boolean }) => {
      if (isFollowing) {
        return facultyApi.unfollowFaculty(facultyId);
      } else {
        return facultyApi.followFaculty(facultyId);
      }
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['faculty', 'followed'] });
      
      // Snapshot the previous value
      const previousFollowed = queryClient.getQueryData<Faculty[]>(queryKeys.facultyFollowed());
      
      // Optimistically update to the new value
      queryClient.setQueryData<Faculty[]>(queryKeys.facultyFollowed(), (oldData) => {
        if (!oldData) return oldData;
        if (variables.isFollowing) {
          // Remove from followed list
          return oldData.filter(f => f.id !== variables.facultyId);
        } else {
          // For follow, we can't add without full faculty data, so we'll refetch
          return oldData;
        }
      });
      
      // Return a context object with the snapshotted value
      return { previousFollowed };
    },
    onSuccess: (_, variables) => {
      // Only invalidate the specific faculty's data and followed list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.facultyList() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.facultyFollowed() 
      });
      toast({
        description: 'Follow status updated successfully'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
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
    // Get current follow status from the backend or local state
    const isCurrentlyFollowing = isFollowing(facultyId);
    
    followMutation.mutate({ facultyId, isFollowing: isCurrentlyFollowing });
  };

  const handleBookAppointment = () => {
    toast({
      title: 'Appointment Booked!',
      description: `Your appointment with ${selectedFaculty?.name} has been requested.`,
    });
    setSelectedFaculty(null);
    setBookingStep(0);
    setSelectedDate('');
    setSelectedDay('');
    setSelectedSlot('');
    setAppointmentTitle('');
    setAppointmentDescription('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setAvailabilityFilter('all');
  };

  // Get next 7 days for booking
  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return days;
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
              placeholder="Search by name, department, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-48">
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
            <SelectTrigger className="w-full sm:w-48">
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

        {/* Faculty Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {facultyList.map(f => (
              <div key={f.id}>
                <Card className="hover-lift overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header with avatar */}
                    <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/5 to-accent/10">
                      <button
                        onClick={() => toggleFollow(f.id)}
                        disabled={followMutation.isPending}
                        className="absolute top-4 right-4 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors disabled:opacity-50"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            isFollowing(f.id)
                              ? 'fill-destructive text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                      
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-card">
                          <AvatarImage src={f.avatar} />
                          <AvatarFallback className="text-lg">{f.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{f.name}</h3>
                          <p className="text-sm text-muted-foreground">{f.department}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-xs ${f.facultyProfile.isOnline ? 'text-success' : 'text-muted-foreground'}`}>
                              <span className={`w-2 h-2 rounded-full ${f.facultyProfile.isOnline ? 'bg-success' : 'bg-muted'}`} />
                              {f.facultyProfile.isOnline ? 'Online' : 'Offline'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {f.facultyProfile.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Body */}
                  <div className="p-6 pt-4 space-y-4">
                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2">
                      {f.facultyProfile.specializations.slice(0, 3).map(spec => (
                        <Badge key={spec.id} variant="secondary" className="text-xs">
                          {spec.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {f.officeLocation}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedFaculty(f);
                          setBookingStep(0);
                        }}
                      >
                        View Profile
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedFaculty(f);
                          setBookingStep(1);
                        }}
                      >
                        Book
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
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

        {/* Faculty Profile / Booking Modal */}
        <Dialog
          open={!!selectedFaculty}
          onOpenChange={() => {
            setSelectedFaculty(null);
            setBookingStep(0);
            setSelectedDate('');
            setSelectedDay('');
            setSelectedSlot('');
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedFaculty && (
              <>
                {bookingStep === 0 ? (
                  // Profile View
                  <>
                    <DialogHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={selectedFaculty.avatar} />
                          <AvatarFallback className="text-2xl">{selectedFaculty.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <DialogTitle className="text-xl">{selectedFaculty.name}</DialogTitle>
                          <DialogDescription className="mt-1">
                            {selectedFaculty.department}
                          </DialogDescription>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              {selectedFaculty.facultyProfile.rating} ({selectedFaculty.facultyProfile.reviewCount} reviews)
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {selectedFaculty.followerCount} followers
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {/* Bio */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">About</h4>
                        <p className="text-sm text-muted-foreground">{selectedFaculty.bio}</p>
                      </div>

                      {/* Qualifications */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Qualifications</h4>
                        <ul className="space-y-1">
                          {selectedFaculty.qualifications.map((q, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <Check className="h-4 w-4 text-success" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Specializations */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedFaculty.facultyProfile.specializations.map(spec => (
                            <Badge key={spec.id} variant="secondary">{spec.name}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Office Location */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Office Location</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {selectedFaculty.officeLocation}
                        </p>
                      </div>

                      {/* Availability Preview */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Weekly Availability</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {selectedFaculty.availability.slice(0, 5).map(avail => (
                            <div key={avail.day} className="text-center p-2 rounded-lg bg-accent/50">
                              <p className="text-xs font-medium text-foreground">{avail.day.slice(0, 3)}</p>
                              <p className="text-xs text-muted-foreground">{avail.slots.length} slots</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant={isFollowing(selectedFaculty.id) ? 'outline' : 'secondary'}
                          onClick={() => toggleFollow(selectedFaculty.id)}
                          disabled={followMutation.isPending}
                        >
                          <Heart className={`mr-2 h-4 w-4 ${isFollowing(selectedFaculty.id) ? 'fill-current' : ''}`} />
                          {isFollowing(selectedFaculty.id) ? 'Following' : 'Follow'}
                        </Button>
                        <Button className="flex-1" onClick={() => setBookingStep(1)}>
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  </>
                ) : bookingStep === 1 ? (
                  // Date Selection
                  <>
                    <DialogHeader>
                      <DialogTitle>Select Date</DialogTitle>
                      <DialogDescription>Choose a date for your appointment with {selectedFaculty.name}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4">
                      {getNextDays().map(d => (
                        <button
                          key={d.date}
                          onClick={() => {
                            setSelectedDate(d.date);
                            setSelectedDay(
                              new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' })
                            );
                            setSelectedSlot('');
                            setBookingStep(2);
                          }}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            selectedDate === d.date
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card hover:bg-accent border-border'
                          }`}
                        >
                          <p className="text-xs font-medium">{d.day}</p>
                          <p className="text-lg font-bold">{d.dayNum}</p>
                          <p className="text-xs">{d.month}</p>
                        </button>
                      ))}
                    </div>

                    <Button variant="outline" className="mt-4" onClick={() => setBookingStep(0)}>
                      Back to Profile
                    </Button>
                  </>
                ) : bookingStep === 2 ? (
                  // Time Slot Selection
                  <>
                    <DialogHeader>
                      <DialogTitle>Select Time Slot</DialogTitle>
                      <DialogDescription>
                        Available slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </DialogDescription>
                    </DialogHeader>

                    {(() => {
                      const dayAvailability = selectedFaculty.availability.find(a => a.day === selectedDay);
                      const slots = dayAvailability?.slots || [];

                      if (slots.length === 0) {
                        return (
                          <div className="mt-4 p-4 rounded-lg bg-accent/50 text-sm text-muted-foreground">
                            No slots available for {selectedDay || 'this day'}. Please choose another date.
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {slots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => { setSelectedSlot(slot); setBookingStep(3); }}
                              className={`px-4 py-2 rounded-lg border transition-colors ${
                                selectedSlot === slot
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-card hover:bg-accent border-border'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <Button variant="outline" className="mt-4" onClick={() => setBookingStep(1)}>
                      Back
                    </Button>
                  </>
                ) : (
                  // Appointment Details
                  <>
                    <DialogHeader>
                      <DialogTitle>Appointment Details</DialogTitle>
                      <DialogDescription>
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedSlot}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Doubt Session - Data Structures"
                          value={appointmentTitle}
                          onChange={(e) => setAppointmentTitle(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Tell the faculty what you'd like to discuss..."
                          value={appointmentDescription}
                          onChange={(e) => setAppointmentDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {selectedSlot}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {selectedFaculty.officeLocation}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setBookingStep(2)}>
                          Back
                        </Button>
                        <Button className="flex-1" onClick={handleBookAppointment} disabled={!appointmentTitle}>
                          Confirm Booking
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FindFaculty;
