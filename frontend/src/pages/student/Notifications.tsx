import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationsApi } from '@/api';
import { Bell, Check, CheckCheck, Calendar, Megaphone, UserPlus, X, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NotificationType = 'appointment_accepted' | 'appointment_rejected' | 'appointment_cancelled' | 'appointment_reminder' | 'new_follower' | 'new_announcement' | 'appointment_request';

const StudentNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'appointments' | 'announcements'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationsApi.getNotifications();
        if (response.success) {
          setNotifications(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Track read status locally
  const [readIds, setReadIds] = useState<string[]>([]);
  const isRead = (id: string) => readIds.includes(id);
  const unreadCount = notifications.filter(n => !n.read && !isRead(n._id)).length;

  const getFilteredNotifications = () => {
    let filtered = notifications;  // Use API data, not static userNotifications

    if (activeTab === 'appointments') {
      filtered = filtered.filter(n =>
        n.type.includes('appointment') || n.type === 'appointment_reminder'
      );
    } else if (activeTab === 'announcements') {
      filtered = filtered.filter(n => n.type === 'new_announcement');
    }

    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const markAsRead = async (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds([...readIds, id]);
      try {
        await notificationsApi.markAsRead(id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    setReadIds([...readIds, ...unreadIds]);
    try {
      await notificationsApi.markAllAsRead();
      toast({ description: 'All notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
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

  const getNotificationColor = (type: NotificationType) => {
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
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
              <Button variant="outline" onClick={markAllAsRead}>
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
                    const read = notification.read || isRead(notification._id);

                    return (
                      <Card
                        key={notification._id}
                        className={cn(
                          'transition-all cursor-pointer hover:shadow-md',
                          !read && 'border-primary/30 bg-primary/5'
                        )}
                        onClick={() => markAsRead(notification._id)}
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
                                {formatTimeAgo(notification.createdAt)}
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
      )}
    </DashboardLayout>
  );
};

export default StudentNotifications;