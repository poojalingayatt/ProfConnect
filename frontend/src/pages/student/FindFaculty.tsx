import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { Search, Filter, Star, MapPin, Heart, X, Calendar, Clock } from 'lucide-react';
import BookingModal from '@/components/booking/BookingModal';
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
import { getFacultyReviews } from '@/api/reviews';

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
  avatar?: string;
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
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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
    // Access nested properties directly: faculty.facultyProfile.rating
  }));

  // Get departments for filter dropdown
  const departments = ['all', ...new Set(facultyList.map(f => f.department || 'Unknown'))];
  
  const { user } = useAuth();
  
  // Get user's followed faculty IDs
  const { data: followedIds = [], isLoading: followedLoading } = useQuery({
    queryKey: ['followedFacultyIds'],
    queryFn: facultyApi.getMyFollowedIds,
    enabled: !!user,
  });

  const isFollowing = (facultyId: number) => {
    return followedIds.includes(facultyId);
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
        queryKey: ['followedFacultyIds'] 
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

  const handleViewProfile = (faculty: FacultyListItem) => {
    setSelectedFaculty(faculty);
    setProfileModalOpen(true);
  };

  const { data: facultyReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['facultyReviews', selectedFaculty?.id],
    queryFn: () => selectedFaculty?.id ? getFacultyReviews(selectedFaculty.id) : [],
    enabled: !!selectedFaculty?.id && profileModalOpen,
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setAvailabilityFilter('all');
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

                    {/* Location - Backend will provide when available */}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewProfile(f)}
                      >
                        View Profile
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setSelectedFaculty(f)}
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

        {/* Booking Modal */}
        <BookingModal
          open={!!selectedFaculty && !profileModalOpen}
          onClose={() => setSelectedFaculty(null)}
          facultyId={selectedFaculty?.id ?? 0}
          facultyName={selectedFaculty?.name ?? ""}
        />

        {/* Faculty Profile Modal */}
        <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Faculty Profile</DialogTitle>
              <DialogDescription>
                {selectedFaculty?.name} - {selectedFaculty?.department}
              </DialogDescription>
            </DialogHeader>
            
            {selectedFaculty && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedFaculty.avatar} />
                    <AvatarFallback className="text-2xl">{selectedFaculty.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedFaculty.name}</h3>
                    <p className="text-muted-foreground">{selectedFaculty.department}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-warning text-warning" />
                        <span className="font-medium">{selectedFaculty.facultyProfile.rating}</span>
                        <span className="text-muted-foreground text-sm">
                          ({selectedFaculty.facultyProfile.reviewCount} reviews)
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${selectedFaculty.facultyProfile.isOnline ? 'text-success' : 'text-muted-foreground'}`}>
                        <span className={`w-2 h-2 rounded-full ${selectedFaculty.facultyProfile.isOnline ? 'bg-success' : 'bg-muted'}`} />
                        {selectedFaculty.facultyProfile.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedFaculty.facultyProfile.bio && (
                  <div>
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-muted-foreground">{selectedFaculty.facultyProfile.bio}</p>
                  </div>
                )}

                {/* Specializations */}
                <div>
                  <h4 className="font-medium mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFaculty.facultyProfile.specializations.map(spec => (
                      <Badge key={spec.id} variant="secondary">
                        {spec.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Location - Backend will provide when available */}

                {/* Reviews Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Reviews</h4>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium">{selectedFaculty.facultyProfile.rating}</span>
                      <span className="text-muted-foreground text-sm">
                        ({selectedFaculty.facultyProfile.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  
                  {reviewsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    </div>
                  ) : facultyReviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No reviews yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {facultyReviews.map((review: any) => (
                        <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setProfileModalOpen(false);
                      setTimeout(() => setSelectedFaculty(selectedFaculty), 100);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button
                    onClick={() => toggleFollow(selectedFaculty.id)}
                    disabled={followMutation.isPending}
                    className="flex-1"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {isFollowing(selectedFaculty.id) ? 'Unfollow' : 'Follow'}
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
