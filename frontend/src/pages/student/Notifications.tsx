import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { Bell, CheckCheck, Calendar, Megaphone, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const StudentNotifications = () => {
  const { user } = useAuth();
  const { getNotificationsFor, markAsRead, markAllAsRead } = useNotifications();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'appointments' | 'announcements'>('all');

  const userNotifications = user ? getNotificationsFor(user.role, user.id) : [];
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getFilteredNotifications = () => {
    let filtered = userNotifications;

    if (activeTab === 'appointments') {
      filtered = filtered.filter(n => 
        n.type.includes('appointment') || n.type === 'appointment_reminder'
      );
    } else if (activeTab === 'announcements') {
      filtered = filtered.filter(n => n.type === 'new_announcement');
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    markAllAsRead(user.role, user.id);
    toast({ description: 'All notifications marked as read' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_accepted':
      case 'appointment_rejected':
      case 'appointment_cancelled':
      case 'appointment_reminder':
        return Calendar;
      case 'new_announcement':
        return Megaphone;
      case 'new_follower':
        return UserPlus;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment_accepted':
        return 'text-success bg-success/10';
      case 'appointment_rejected':
      case 'appointment_cancelled':
        return 'text-destructive bg-destructive/10';
      case 'appointment_reminder':
        return 'text-warning bg-warning/10';
      case 'new_announcement':
        return 'text-primary bg-primary/10';
      case 'new_follower':
        return 'text-accent-foreground bg-accent';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">No notifications</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? "You're all caught up! New notifications will appear here."
                    : `No ${activeTab} notifications to show.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);
                  const read = notification.read;
                  
                  return (
                    <Card 
                      key={notification.id}
                      className={cn(
                        'transition-all cursor-pointer hover:shadow-md',
                        !read && 'border-primary/30 bg-primary/5'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            getNotificationColor(notification.type)
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm',
                              read ? 'text-muted-foreground' : 'text-foreground font-medium'
                            )}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          
                          {!read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;