import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { facultyApi } from '@/api/faculty';

const FacultyFollowers = () => {
  const { user } = useAuth();

  // Fetch followers from backend
  const { data: followersRaw = [], isLoading, error } = useQuery({
    queryKey: queryKeys.facultyFollowers(),
    queryFn: facultyApi.getMyFollowers,
    placeholderData: [],
  });
  
  // Transform backend data to UI format
  const followers = followersRaw.map(faculty => ({
    id: faculty.id,
    name: faculty.name,
    department: faculty.department || 'Unknown',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${faculty.name}`,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Followed By</h1>
          <p className="text-muted-foreground mt-1">
            {followers.length} students are following you
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading followers: {(error as Error).message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No followers yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Students who follow you will appear here. Keep your profile updated and availability current to attract more students.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {followers.map(student => (
              <Card key={student.id} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.department}</p>
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
    </DashboardLayout>
  );
};

export default FacultyFollowers;
