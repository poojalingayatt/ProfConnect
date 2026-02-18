import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { Heart, Star, MapPin, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyApi } from '@/api/faculty';
import { Faculty } from '@/types/faculty';

type FacultyListItem = {
  id: number;
  name: string;
  department: string;
  avatar?: string;
  isOnline: boolean;
  rating: number;
  announcements: { date: string; title: string }[];
  officeLocation: string;
};

// Transform backend Faculty to UI format
const transformFollowedFaculty = (faculty: Faculty): FacultyListItem => {
  return {
    id: faculty.id,
    name: faculty.name,
    department: faculty.department || 'Unknown',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${faculty.name}`,
    isOnline: faculty.facultyProfile.isOnline,
    rating: faculty.facultyProfile.rating,
    announcements: [], // TODO: Replace with actual announcements from backend
    officeLocation: 'Building A, Room 101', // TODO: Replace with actual office location from backend
  };
};


const FollowedFaculty = () => {
  useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch followed faculty from backend
  const { data: followedFacultyRaw = [], isLoading, error } = useQuery({
    queryKey: queryKeys.facultyFollowed(),
    queryFn: facultyApi.getMyFollowed,
    placeholderData: [],
  });
  
  // Transform backend data to UI format
  const followedFaculty = followedFacultyRaw.map(transformFollowedFaculty);

  // Mutation for unfollow with proper optimistic update and rollback
  const unfollowMutation = useMutation({
    mutationFn: (facultyId: number) => facultyApi.unfollowFaculty(facultyId),
    onMutate: async (facultyId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.facultyFollowed() });
      
      // Snapshot the previous value
      const previousFollowed = queryClient.getQueryData<Faculty[]>(queryKeys.facultyFollowed());
      
      // Optimistically update to the new value
      queryClient.setQueryData<Faculty[]>(queryKeys.facultyFollowed(), (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter(f => f.id !== facultyId);
      });
      
      // Return a context object with the snapshotted value
      return { previousFollowed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.facultyFollowed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.facultyList() });
      toast({ description: 'Unfollowed successfully' });
    },
    onError: (error: any, facultyId, context) => {
      // Rollback to the previous value
      if (context?.previousFollowed) {
        queryClient.setQueryData(queryKeys.facultyFollowed(), context.previousFollowed);
      }
      
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to unfollow faculty',
        variant: 'destructive'
      });
    }
  });

  const handleUnfollow = (facultyId: number) => {
    unfollowMutation.mutate(facultyId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Followed Faculty</h1>
          <p className="text-muted-foreground mt-1">
            Faculty members you follow ({followedFaculty.length})
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading followed faculty: {(error as Error).message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : followedFaculty.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No followed faculty yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search and follow faculty members to see their updates and availability here.
            </p>
            <Button className="mt-6" onClick={() => navigate('/student/find-faculty')}>
              Find Faculty
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {followedFaculty.map(f => (
              <Card key={f.id} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={f.avatar} />
                      <AvatarFallback className="text-lg">{f.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-foreground truncate">{f.name}</h3>
                          <p className="text-sm text-muted-foreground">{f.department}</p>
                        </div>
                        <button
                          onClick={() => handleUnfollow(f.id)}
                          disabled={unfollowMutation.isPending}
                          className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
                        >
                          <Heart className="h-5 w-5 fill-destructive text-destructive" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs ${f.isOnline ? 'text-success' : 'text-muted-foreground'}`}>
                          <span className={`w-2 h-2 rounded-full ${f.isOnline ? 'bg-success' : 'bg-muted'}`} />
                          {f.isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {f.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Latest announcement */}
                  {f.announcements.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Megaphone className="h-3 w-3" />
                        Latest Announcement
                      </div>
                      <p className="text-sm text-foreground">{f.announcements[0].title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(f.announcements[0].date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {f.officeLocation}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/student/find-faculty')}>
                      View Profile
                    </Button>
                    <Button className="flex-1" onClick={() => navigate('/student/find-faculty')}>
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FollowedFaculty;
