import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  Home,
  Search,
  Calendar,
  Heart,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Clock,
  Users,
  Megaphone,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationsContext';

interface DashboardLayoutProps {
  children: ReactNode;
  disableContentPadding?: boolean;
  contentClassName?: string;
  disableMainScroll?: boolean;
}

const DashboardLayout = ({
  children,
  disableContentPadding = false,
  contentClassName,
  disableMainScroll = false,
}: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
      return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const studentNavItems = [
    { icon: Home, label: 'Dashboard', path: '/student/dashboard' },
    { icon: Search, label: 'Find Faculty', path: '/student/faculty' },
    { icon: MessageCircle, label: 'Messages', path: '/student/chat' },
    { icon: Calendar, label: 'My Appointments', path: '/student/appointments' },
    { icon: Heart, label: 'Followed Faculty', path: '/student/followed' },
    { icon: Bell, label: 'Notifications', path: '/student/notifications' },
    { icon: Settings, label: 'Settings', path: '/student/settings' },
  ];

  const facultyNavItems = [
    { icon: Home, label: 'Dashboard', path: '/faculty/dashboard' },
    { icon: Clock, label: 'Manage Availability', path: '/faculty/availability' },
    { icon: MessageCircle, label: 'Messages', path: '/faculty/chat' },
    { icon: Calendar, label: 'Appointments', path: '/faculty/appointments' },
    { icon: Users, label: 'Followed By', path: '/faculty/followers' },
    { icon: Bell, label: 'Notifications', path: '/faculty/notifications' },
    { icon: Settings, label: 'Settings', path: '/faculty/settings' },
  ];

  const navItems = user?.role === 'FACULTY' ? facultyNavItems : studentNavItems;

  const userNotifications = notifications.filter((n) => !n.read);

  const badgeCount = user ? unreadCount : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    document.documentElement.classList.add('dashboard-scroll-lock');
    document.body.classList.add('dashboard-scroll-lock');
    return () => {
      document.documentElement.classList.remove('dashboard-scroll-lock');
      document.body.classList.remove('dashboard-scroll-lock');
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground hidden sm:block">
                ProfConnect
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {badgeCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNotifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                ) : (
                  userNotifications.slice(0, 5).map(notif => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3">
                      <span className="text-sm">{notif.message}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate(user?.role === 'FACULTY' ? '/faculty/settings' : '/student/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 bg-card border-r border-border transition-all duration-300 z-30',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
          'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors',
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5" />
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className={cn('w-full', sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3')}
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={cn(
          'pt-16 h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64',
          disableMainScroll ? 'overflow-hidden' : 'overflow-y-auto'
        )}
      >
        <div
          className={cn(
            disableContentPadding ? 'h-[calc(100vh-4rem)]' : 'p-4 sm:p-6 lg:p-8',
            contentClassName
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
