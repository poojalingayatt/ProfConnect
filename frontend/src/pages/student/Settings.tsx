import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, AlertTriangle, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const StudentSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    inApp: true,
    reminder24h: true,
    reminder1h: true,
    announcements: true,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showEmail: false,
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleSaveProfile = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile has been saved successfully.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Notification preferences updated',
      description: 'Your notification settings have been saved.',
    });
  };

  const handleSavePrivacy = () => {
    toast({
      title: 'Privacy settings updated',
      description: 'Your privacy settings have been saved.',
    });
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your new passwords match.',
      });
      return;
    }
    if (passwords.new.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
      });
      return;
    }
    toast({
      title: 'Password changed',
      description: 'Your password has been updated successfully.',
    });
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleDownloadData = () => {
    toast({
      title: 'Download started',
      description: 'Your data is being prepared for download.',
    });
  };

  const handleDeactivateAccount = () => {
    logout();
    navigate('/');
    toast({
      title: 'Account deactivated',
      description: 'Your account has been deactivated.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Email notifications</p>
                      <p className="text-sm text-muted-foreground">Receive email updates for appointment changes</p>
                    </div>
                    <Switch
                      checked={notifications.emailAppointments}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailAppointments: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">In-app notifications</p>
                      <p className="text-sm text-muted-foreground">Show notifications within the app</p>
                    </div>
                    <Switch
                      checked={notifications.inApp}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, inApp: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">24-hour reminder</p>
                      <p className="text-sm text-muted-foreground">Get reminded 24 hours before appointments</p>
                    </div>
                    <Switch
                      checked={notifications.reminder24h}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, reminder24h: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">1-hour reminder</p>
                      <p className="text-sm text-muted-foreground">Get reminded 1 hour before appointments</p>
                    </div>
                    <Switch
                      checked={notifications.reminder1h}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, reminder1h: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Faculty announcements</p>
                      <p className="text-sm text-muted-foreground">Notifications from followed faculty</p>
                    </div>
                    <Switch
                      checked={notifications.announcements}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, announcements: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Show profile to faculty</p>
                      <p className="text-sm text-muted-foreground">Allow faculty to view your profile</p>
                    </div>
                    <Switch
                      checked={privacy.showProfile}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showProfile: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Show email on profile</p>
                      <p className="text-sm text-muted-foreground">Display your email address publicly</p>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showEmail: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePrivacy}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleChangePassword}>Change Password</Button>
                </CardContent>
              </Card>

              {/* Data & Account */}
              <Card>
                <CardHeader>
                  <CardTitle>Data & Account</CardTitle>
                  <CardDescription>Manage your data and account status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground">Download my data</p>
                      <p className="text-sm text-muted-foreground">Get a copy of all your data</p>
                    </div>
                    <Button variant="outline" onClick={handleDownloadData}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                    <div>
                      <p className="font-medium text-foreground">Deactivate account</p>
                      <p className="text-sm text-muted-foreground">This will disable your account</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Deactivate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will deactivate your account. You can contact support to reactivate it later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeactivateAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deactivate Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;