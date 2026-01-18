import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { followsApi } from '@/api';
import { Users, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/Layout/DashboardLayout';

const FacultyFollowers = () => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true);
        const response = await followsApi.getFollowers();
        if (response.success) {
          setFollowers(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch followers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Followed By</h1>
            <p className="text-muted-foreground mt-1">
              {followers.length} students are following you
            </p>
          </div>

          {followers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No followers yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Students who follow you will appear here. Keep your profile updated and availability current to attract more students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {followers.map(follower => (
                <Card key={follower._id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.avatarUrl} />
                        <AvatarFallback>{follower.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{follower.name}</h3>
                        <p className="text-sm text-muted-foreground">{follower.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Following since recently</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default FacultyFollowers;
