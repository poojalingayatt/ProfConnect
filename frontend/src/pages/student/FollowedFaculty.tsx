import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { followsApi } from '@/api';
import { Heart, Star, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const FollowedFaculty = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [followedFaculty, setFollowedFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowedFaculty = async () => {
    try {
      setLoading(true);
      const response = await followsApi.getMyFollows();
      if (response.success) {
        setFollowedFaculty(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch followed faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowedFaculty();
  }, []);

  const handleUnfollow = async (facultyId: string) => {
    try {
      await followsApi.unfollowFaculty(facultyId);
      toast({ description: 'Unfollowed successfully' });
      // Refresh the list
      fetchFollowedFaculty();
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to unfollow'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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

        {followedFaculty.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No followed faculty yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search and follow faculty members to see their updates and availability here.
            </p>
            <Button className="mt-6" onClick={() => navigate('/student/faculty')}>
              Find Faculty
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {followedFaculty.map(follow => {
              const facultyUser = follow.facultyId;
              const facultyProfile = follow.profile;

              return (
                <Card key={follow._id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={facultyUser?.avatarUrl} />
                        <AvatarFallback className="text-lg">{facultyUser?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground truncate">{facultyUser?.name}</h3>
                            <p className="text-sm text-muted-foreground">{facultyUser?.department}</p>
                          </div>
                          <button
                            onClick={() => handleUnfollow(facultyUser?._id)}
                            className="p-1 rounded hover:bg-accent transition-colors"
                          >
                            <Heart className="h-5 w-5 fill-destructive text-destructive" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-flex items-center gap-1 text-xs ${facultyProfile?.isOnline ? 'text-success' : 'text-muted-foreground'}`}>
                            <span className={`w-2 h-2 rounded-full ${facultyProfile?.isOnline ? 'bg-success' : 'bg-muted'}`} />
                            {facultyProfile?.isOnline ? 'Online' : 'Offline'}
                          </span>
                          {facultyProfile?.rating && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {facultyProfile.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {facultyProfile?.bio && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">{facultyProfile.bio}</p>
                      </div>
                    )}

                    {/* Location */}
                    {facultyProfile?.officeLocation && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {facultyProfile.officeLocation}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                      <Button variant="outline" className="flex-1" onClick={() => navigate('/student/faculty')}>
                        View Profile
                      </Button>
                      <Button className="flex-1" onClick={() => navigate('/student/faculty')}>
                        Book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FollowedFaculty;
