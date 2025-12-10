import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { faculty } from '@/data/users';
import { Heart, Star, MapPin, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const FollowedFaculty = () => {
  const { getStudentData } = useAuth();
  const studentData = getStudentData();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [followedIds, setFollowedIds] = useState<number[]>(studentData?.followedFaculty || []);

  const followedFaculty = faculty.filter(f => followedIds.includes(f.id));

  const handleUnfollow = (facultyId: number) => {
    setFollowedIds(prev => prev.filter(id => id !== facultyId));
    toast({ description: 'Unfollowed successfully' });
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
                          className="p-1 rounded hover:bg-accent transition-colors"
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
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/student/faculty')}>
                      View Profile
                    </Button>
                    <Button className="flex-1" onClick={() => navigate('/student/faculty')}>
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
